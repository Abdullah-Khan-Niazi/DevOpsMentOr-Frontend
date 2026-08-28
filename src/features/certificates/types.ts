/** GAM-14: public certificate verification payload (no sensitive fields). */
export interface CertificateVerificationDto {
  certificateNumber: string;
  holderName: string;
  courseTitle: string;
  issuedAt: string;
  isValid: boolean;
}
