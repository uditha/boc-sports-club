import { z } from "zod";


export const playerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  branch: z.string().min(1, "Branch is required"),
  // stored as comma-separated, e.g. "Athletics,Swimming"
  sports: z.array(z.string()).min(1, "Select at least one sport"),
  gender: z.enum(["M", "F"], { error: "Please select a gender" }),
  dateOfBirth: z.string().optional(),
  joinedYear: z.string().optional(),
  photoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type PlayerFormData = z.infer<typeof playerSchema>;
