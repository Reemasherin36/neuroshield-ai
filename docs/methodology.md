# Methodology

The user-facing, beginner-friendly version is the **Methodology page** in the app. It reads real values from the trained artifacts. This file is the reproducible, technical companion.

## Reproduce
```powershell
.\scripts\train.ps1     # EDA -> train -> evaluate (test set, once) -> reports -> dataset summary
```
Outputs: `docs/eda.md`, `docs/model_selection.md` (both generated from real numbers), and `artifacts/*.json`, `artifacts/pipeline.joblib`, plots.

## Steps
1. **Validate** the CSV has all required columns. Missing columns raise a friendly "setup required" error.
2. **Parse.** BMI is read as numeric. Literal `N/A` strings become missing (201 in the Kaggle file). `id` is dropped.
3. **Split.** Stratified 60/20/20 (train/validation/test), seed 42.
4. **Preprocess** (inside one scikit-learn `ColumnTransformer` in a `Pipeline`, fitted on training data only): median imputation for BMI with a missing-indicator, standard scaling of age, glucose and BMI, one-hot encoding with `handle_unknown="ignore"` for categoricals, binary flags passed through.
5. **Train** logistic regression, random forest and histogram gradient boosting. Imbalance is handled with class weights. Each model is tuned with 5-fold stratified cross-validation over a small grid, scored by average precision (PR-AUC).
6. **Calibrate** with sigmoid calibration (5-fold, training data only).
7. **Select** the model by validation PR-AUC, not accuracy.
8. **Threshold** chosen on the validation set: highest precision subject to recall >= 0.80.
9. **Evaluate once** on the test set: recall, precision, F1, specificity, ROC-AUC, PR-AUC, Brier score, confusion matrix, calibration curve, a dummy baseline.
10. **Explain** with permutation importance on the validation set, using the full pipeline.

## Why not SMOTE
The brief allowed class weights or SMOTE inside cross-validation. Class weights were used because they keep the pipeline simple and avoid synthetic rows. `imbalanced-learn` is installed but unused.

## Display rules derived from evaluation
- The UI shows a **band** (lower / moderate / higher than typical in the training data) relative to the threshold: lower is below half the threshold, moderate is up to the threshold, higher is at or above it. The 0.5 fraction is an arbitrary presentation choice.
- A percentage is shown only if the test set passes a documented check (expected calibration error <= 0.03 and Brier score better than the prevalence baseline). With about 50 positive cases this check is noisy, so any percentage is labelled approximate.

See [limitations.md](limitations.md) for what these results do and do not support.
