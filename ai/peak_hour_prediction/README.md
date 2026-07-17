# Hospital Check-in Peak Forecast

Project dự đoán số lượng bệnh nhân lấy số/check-in theo từng khung 30 phút.

## Dữ liệu

File mẫu:

```text
data/checkin_slots_2026_06.csv
```

Mỗi dòng là một khung 30 phút:

```text
checkin_time,date,slot_start,slot_index,day_of_week,day_name,month,is_weekend,checkin_count
```

`checkin_count` là biến mục tiêu cần dự đoán.

Dữ liệu không sử dụng:

- Số bác sĩ.
- Số phòng.
- Thiết bị.
- Công suất phục vụ.

## Cấu trúc thư mục

```text
hospital_checkin_forecast_project/
├── data/
│   └── checkin_slots_2026_06.csv
├── models/
├── reports/
├── src/
│   ├── config.py
│   ├── data_loader.py
│   ├── features.py
│   ├── train.py
│   └── predict.py
├── README.md
└── requirements.txt
```

## Cài đặt

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Trên Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

## Train model

Đứng tại thư mục gốc của project:

```bash
python -m src.train
```

Kết quả được lưu tại:

```text
models/checkin_forecast_model.joblib
models/model_metadata.json
reports/metrics.json
reports/test_predictions.csv
```

## Dự đoán ngày tiếp theo

```bash
python -m src.predict
```

Kết quả:

```text
reports/next_day_forecast.csv
```

## Lưu ý

File một tháng chỉ phù hợp để chạy thử pipeline. Để model có kết quả đáng tin cậy,
nên sử dụng tối thiểu 6 tháng và tốt hơn là 12 tháng dữ liệu check-in thực tế.
