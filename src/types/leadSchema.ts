// src/types/leadSchema.ts
import { z } from 'zod';

export const leadStatusSchema = z.enum(['P1', 'P2', 'P3']);

export const leadSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  status: leadStatusSchema,
  agent_id: z.string().uuid({ message: "Invalid Agent ID" }).optional().or(z.literal('')),
  leadSource: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone Number is required'), // Add more specific phone validation if needed
  dealValue: z.coerce.number({
    invalid_type_error: "Deal value must be a number",
  }).positive('Deal value must be positive').optional().or(z.literal('')),
  companySize: z.coerce.number({
    invalid_type_error: "Company size must be a number",
  }).int('Company size must be an integer').positive('Company size must be positive').optional().or(z.literal('')),
  tags: z.string().optional(), // Comma-separated string or an array of strings
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>; 