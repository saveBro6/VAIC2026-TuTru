const { z } = require('zod');
const routingService = require('./routing.service');

const optimizeSequenceSchema = z.object({
  clinic_specialities: z.array(z.string().min(1)).min(1),
  patient_token: z.string().min(1),
});

const createJourneyAndOptimizeSchema = z.object({
  department_code: z.string().min(1),
  identification_code: z.string().min(1).optional(),
  patient_name: z.string().min(1).optional(),
  patient_token: z.string().min(1).optional(),
  priority: z.string().min(1).optional(),
  symptom_text: z.string().optional(),
});

const optimizeSequence = async (req, res, next) => {
  try {
    let result;
    if (req.body.department_code || req.body.departmentCode) {
      const validatedData = createJourneyAndOptimizeSchema.parse({
        ...req.body,
        department_code: req.body.department_code || req.body.departmentCode,
      });
      result = await routingService.createJourneyAndOptimize(validatedData);
    } else {
      const validatedData = optimizeSequenceSchema.parse({
        ...req.body,
        clinic_specialities: req.body.clinic_specialities || req.body.clinicSpecialities,
      });
      result = await routingService.optimizeSequenceWithAi({
        clinicSpecialities: validatedData.clinic_specialities,
        patientToken: validatedData.patient_token,
      });
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  optimizeSequence,
};
