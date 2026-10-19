# Limitations

This is an **educational, research-only prototype**. It is not a medical device, is not clinically validated, and must not be used to decide whether to seek care.

## Data
- Kaggle "Stroke Prediction Dataset": 5,110 rows, 249 recorded strokes (4.9%). Its origin is not well documented, and it is not a clinical cohort.
- Few positive cases: each 20% split holds about 50 strokes, so every metric is noisy and model differences are small compared with that noise. No confidence intervals were computed.
- 201 BMI values were literal `N/A`, 1,544 people have smoking status "Unknown" (a category, not missing), one row has gender "Other", and the file includes children.
- Only ten inputs. Important factors (family history, medication, atrial fibrillation, cholesterol, and others) are absent.

## Model
- Low precision at the chosen threshold: most people flagged as higher than typical did not have a stroke in the test data, while some who did were not flagged. See `docs/model_selection.md` for the exact figures.
- One train/validation/test split, one dataset, no external validation.
- Feature importance describes the model, not medicine, and is not causal.
- The probability calibration check is rough at this sample size.

## Software
- Local SQLite is not encrypted at rest. The login rate limiter is in memory. There is no email verification, password reset, or session revocation.
- The app has not been deployed, load-tested, or penetration-tested. See `security_review.md`.
- No browser-based checks (responsive layout, Lighthouse, measured contrast, reduced-motion behaviour) have been run yet. See `qa_checklist.md` for the steps to run them.

## Claims this project does not make
No diagnosis, no clinical validity, no accuracy guarantee, no regulatory or privacy-law compliance (for example HIPAA or GDPR), and no endorsement by any clinician or organisation.
