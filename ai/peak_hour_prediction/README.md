# Hospital Peak Hour Prediction API

Hệ thống dự đoán số lượng bệnh nhân **check-in/lấy số khám** theo từng khung 30 phút và xác định các khung giờ cao điểm trong bệnh viện.

Model chỉ sử dụng dữ liệu lịch sử check-in của bệnh nhân, không sử dụng số lượng bác sĩ, phòng khám, thiết bị hoặc công suất phục vụ.

## 1. Chức năng chính

- Dự đoán số bệnh nhân check-in trong từng khung 30 phút.
- Phát hiện khung giờ cao điểm.
- Phân loại mức độ đông: `low`, `normal`, `high`, `very_high`.
- Dự báo từ 1 đến 7 ngày sau ngày cuối cùng trong dữ liệu lịch sử.
- Cung cấp API FastAPI để Frontend gọi và hiển thị dashboard.

## 2. Cấu trúc thư mục

```text
peak_hour_prediction/
├── .venv/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── forecast.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── features.py
│   │   └── model_loader.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── forecast.py
│   └── services/
│       ├── __init__.py
│       └── forecast_service.py
├── data/
│   ├── checkin_slots_2026_06.csv
│   └── dataset_summary.json
├── models/
│   ├── checkin_forecast_model.joblib
│   └── model_metadata.json
├── reports/
├── .env
├── .env.example
├── .gitignore
├── README.md
└── requirements.txt
```

## 3. Vai trò của các file

### `app/main.py`

- Khởi tạo FastAPI.
- Đọc cấu hình từ `.env`.
- Load model khi server khởi động.
- Cấu hình CORS.
- Đăng ký router.

### `app/api/forecast.py`

Định nghĩa hai API:

- `GET /api/v1/health`
- `POST /api/v1/forecasts`

### `app/core/config.py`

- Đọc biến môi trường.
- Kiểm tra kiểu dữ liệu cấu hình.
- Tạo đường dẫn tới model, metadata và CSV.

### `app/ml/features.py`

Tạo feature dùng cho model:

- `hour`, `minute`, `day_of_week`, `month`.
- `slot_index`.
- `lag_1_day`, `lag_7_days`.
- `rolling_mean_same_slot_3_days`.
- `rolling_std_same_slot_3_days`.

### `app/ml/model_loader.py`

- Load file `.joblib`.
- Load `model_metadata.json`.
- Giữ model trong RAM để dùng lại cho nhiều request.

### `app/schemas/forecast.py`

Khai báo cấu trúc request và response bằng Pydantic.

### `app/services/forecast_service.py`

- Tạo các khung giờ tương lai.
- Tạo feature dự báo.
- Gọi `model.predict()`.
- Phân loại cao điểm.
- Dự báo đệ quy khi yêu cầu nhiều ngày.

## 4. Dữ liệu đầu vào

File hiện tại:

```text
data/checkin_slots_2026_06.csv
```

Mỗi dòng đại diện cho một khung 30 phút:

```csv
checkin_time,date,slot_start,slot_index,day_of_week,day_name,month,is_weekend,checkin_count
2026-06-01 07:00:00,2026-06-01,07:00,0,0,Monday,6,0,24
2026-06-01 07:30:00,2026-06-01,07:30,1,0,Monday,6,0,39
2026-06-01 08:00:00,2026-06-01,08:00,2,0,Monday,6,0,61
```

Biến model cần dự đoán là:

```text
checkin_count
```

## 5. Cài đặt

### Tạo môi trường ảo

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

### Cài thư viện

```bash
pip install -r requirements.txt
```

Ví dụ `requirements.txt`:

```txt
fastapi
uvicorn[standard]
pandas
numpy
scikit-learn
joblib
pydantic
pydantic-settings
python-dotenv
```

Phiên bản `scikit-learn` khi chạy API nên giống phiên bản dùng để train model.

## 6. Cấu hình `.env`

Tạo `.env` tại thư mục gốc:

```env
APP_NAME=Hospital Check-in Forecast API
APP_VERSION=1.0.0
APP_ENV=development
DEBUG=true

API_PREFIX=/api/v1
HOST=0.0.0.0
PORT=8000

MODEL_PATH=models/checkin_forecast_model.joblib
MODEL_METADATA_PATH=models/model_metadata.json
CHECKIN_DATA_PATH=data/checkin_slots_2026_06.csv

FORECAST_MAX_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Không commit file `.env` lên GitHub.

## 7. Chạy ứng dụng

Đứng tại thư mục `peak_hour_prediction`:

```bash
uvicorn app.main:app --reload
```

Các địa chỉ:

```text
API:     http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs
OpenAPI: http://127.0.0.1:8000/openapi.json
```

## 8. Flow khởi động

```text
Khởi động FastAPI
        ↓
Đọc .env
        ↓
Load checkin_forecast_model.joblib
        ↓
Load model_metadata.json
        ↓
Lưu model vào app.state
        ↓
API sẵn sàng
```

Model được load một lần khi server khởi động, không load lại trong từng request.

## 9. Health API

### Endpoint

```http
GET /api/v1/health
```

### Mục đích

- Kiểm tra API đang hoạt động.
- Kiểm tra model đã được load hay chưa.

### Response

```json
{
  "status": "ok",
  "model_loaded": true
}
```

### Flow

```text
Frontend
   ↓
GET /api/v1/health
   ↓
Kiểm tra model_container
   ↓
Trả status và model_loaded
```

API này không đọc CSV và không chạy dự đoán.

## 10. Forecast API

### Endpoint

```http
POST /api/v1/forecasts
```

### Request

```json
{
  "days": 1
}
```

Giới hạn:

```text
1 <= days <= FORECAST_MAX_DAYS
```

Dự báo một tuần:

```json
{
  "days": 7
}
```

Nếu dữ liệu kết thúc ngày `30/06/2026`, API trả dự báo từ `01/07/2026` đến `07/07/2026`.

### Flow

```text
Frontend gửi POST /api/v1/forecasts
Body: {"days": 1}
              ↓
Pydantic kiểm tra request
              ↓
Kiểm tra model đã load
              ↓
Đọc CSV lịch sử check-in
              ↓
Tìm ngày cuối cùng trong dữ liệu
              ↓
Tạo 20 khung giờ của ngày tiếp theo
              ↓
Tạo lag và rolling feature
              ↓
Gọi model.predict()
              ↓
So sánh với peak_threshold
              ↓
Phân loại peak_level
              ↓
Trả JSON cho Frontend
```

## 11. Dự báo nhiều ngày

Khi `days > 1`, hệ thống dùng dự báo đệ quy.

Ví dụ `days = 3`:

```text
Dữ liệu thực tế đến 30/06
          ↓
Dự đoán 01/07
          ↓
Thêm dự đoán 01/07 vào lịch sử tạm
          ↓
Dự đoán 02/07
          ↓
Thêm dự đoán 02/07 vào lịch sử tạm
          ↓
Dự đoán 03/07
          ↓
Trả kết quả ba ngày
```

Dữ liệu dự đoán chỉ được thêm vào DataFrame tạm trong request, không ghi vào CSV thật.

Ngày càng xa có thể tích lũy sai số. Khi có dữ liệu thực tế mới, nên cập nhật dữ liệu và dự báo lại.

## 12. Response mẫu

```json
{
  "forecast_days": 1,
  "peak_threshold": 47,
  "forecasts": [
    {
      "checkin_time": "2026-07-01T07:00:00",
      "slot_index": 0,
      "predicted_checkin_count": 22.5,
      "is_peak": false,
      "peak_level": "low"
    },
    {
      "checkin_time": "2026-07-01T08:00:00",
      "slot_index": 2,
      "predicted_checkin_count": 57.2,
      "is_peak": true,
      "peak_level": "high"
    }
  ]
}
```

## 13. Quy tắc phân loại

Giả sử `peak_threshold = 47`:

```text
prediction >= threshold × 1.20 → very_high
prediction >= threshold        → high
prediction >= threshold × 0.65 → normal
prediction <  threshold × 0.65 → low
```

## 14. Frontend gọi API

### Fetch

```javascript
async function getForecast(days = 1) {
  const response = await fetch(
    "http://localhost:8000/api/v1/forecasts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ days }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Forecast failed");
  }

  return response.json();
}
```

### Axios

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  timeout: 10000,
});

export async function getForecast(days = 1) {
  const response = await api.post("/forecasts", { days });
  return response.data;
}
```

## 15. Mã lỗi

### `422 Validation Error`

Request sai schema, ví dụ:

```json
{
  "days": 0
}
```

### `503 Service Unavailable`

Model chưa được load:

```json
{
  "detail": "Model chưa sẵn sàng"
}
```

### `500 Internal Server Error`

Có thể do:

- Không tìm thấy CSV.
- Không tìm thấy model hoặc metadata.
- Không đủ dữ liệu để tạo feature.
- Phiên bản thư viện không tương thích với model.

## 16. Kiểm tra bằng Swagger

Mở:

```text
http://127.0.0.1:8000/docs
```

Health API:

1. Mở `GET /api/v1/health`.
2. Chọn `Try it out`.
3. Chọn `Execute`.

Forecast API:

1. Mở `POST /api/v1/forecasts`.
2. Chọn `Try it out`.
3. Nhập:

```json
{
  "days": 7
}
```

4. Chọn `Execute`.

Giá trị trong phần `Example Value` chỉ là schema minh họa, không phải kết quả model thực tế.

## 17. Cập nhật dữ liệu hằng ngày

Ví dụ:

```text
Dữ liệu thực tế đến 30/06
→ dự báo 01/07

Cập nhật dữ liệu thực tế ngày 01/07
→ dự báo 02/07
```

CSV mới cần có đủ các khung từ `07:00` đến `16:30` và đúng `slot_index`.

## 18. Chuyển sang database

Trong triển khai thực tế, nên thay CSV bằng PostgreSQL:

```text
Kiosk/quầy tiếp nhận
        ↓
Lưu log check-in vào database
        ↓
Tổng hợp theo khung 30 phút
        ↓
Forecast API lấy lịch sử
        ↓
Tạo feature và dự đoán
        ↓
Trả kết quả cho Frontend
```

Frontend không nên gửi toàn bộ dữ liệu lịch sử cho API.

## 19. `.gitignore` đề xuất

```gitignore
.venv/
.env

__pycache__/
*.py[cod]
.pytest_cache/

.DS_Store
.vscode/
.idea/

reports/*.csv
reports/*.json
```

Không đưa dữ liệu bệnh nhân thật chưa ẩn danh lên GitHub.

## 20. Hạn chế hiện tại

- Dữ liệu mẫu chỉ có một tháng.
- Dự báo nhiều ngày có thể tích lũy sai số.
- Chưa xử lý ngày lễ và sự kiện bất thường.
- Chưa kết nối database.
- Chưa có scheduler tự động dự báo hoặc train lại model.

Để dùng thực tế, nên có tối thiểu 6 tháng, tốt hơn là 12–24 tháng dữ liệu lịch sử.

## 21. Hướng phát triển

- Kết nối PostgreSQL.
- Dự báo riêng theo khoa.
- Thêm ngày lễ và sự kiện đặc biệt.
- Lưu dự báo vào database.
- Tạo scheduler chạy hằng ngày.
- Theo dõi sai số dự báo so với thực tế.
- Train lại model định kỳ.
- Đóng gói bằng Docker.
- Bổ sung JWT cho API quản trị.

## 22. Chạy nhanh

```bash
cd peak_hour_prediction
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Mở Swagger:

```text
http://127.0.0.1:8000/docs
```