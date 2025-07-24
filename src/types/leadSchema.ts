// src/types/leadSchema.ts
import { z } from 'zod';

export const leadStatusSchema = z.enum(['P1', 'P2', 'P3']);

// Industry options enum
export const industrySchema = z.enum([
  'technology',
  'healthcare', 
  'finance',
  'retail',
  'manufacturing',
  'education',
  'real-estate',
  'consulting',
  'media',
  'transportation',
  'energy',
  'agriculture',
  'construction',
  'hospitality',
  'legal',
  'nonprofit',
  'government',
  'other'
]);

export const leadSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  status: leadStatusSchema,
  agent_id: z.string().uuid({ message: "Invalid Agent ID" }).optional().or(z.literal('')),
  leadSource: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone Number is required'),
  dealValue: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({
      invalid_type_error: "Deal value must be a number",
    }).positive('Deal value must be positive').optional()
  ),
  companySize: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({
      invalid_type_error: "Company size must be a number",
    }).int('Company size must be an integer').positive('Company size must be positive').optional()
  ),
  // ADD THIS NEW FIELD
  industry: industrySchema.optional().or(z.literal('')),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Industry options for dropdowns
export const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select Industry' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'transportation', label: 'Transportation & Logistics' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];