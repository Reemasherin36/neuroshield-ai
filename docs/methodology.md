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
- Users see **two levels**, not the model's three internal bands. A score at or above the decision threshold is shown as **Higher stroke risk**. Anything below it (the internal "lower" and "moderate" bands) is shown as **Lower stroke risk**. The result page states the threshold in plain words.
- The estimated percentage is shown only if the test set passes a documented check (expected calibration error <= 0.03 and Brier score better than the prevalence baseline). With about 50 positive cases this check is noisy, so the page calls the percentage an estimate. If the check fails, the verdict is still shown but the percentage is hidden.
- **What is driving a result.** `POST /predictions/explain` re-scores the person once per feature, with that one answer replaced by the "typical" value (median for numbers, most common category) taken from the **training split** (`artifacts/reference_profile.json`, written by `python -m ml.summarize`). The change in the estimate is that answer's effect, in percentage points. Effects interact, so they do not add up exactly. This is a one-at-a-time what-if comparison, not a causal claim.
- The what-if comparison reports what the model learned, which can disagree with medical knowledge. For example, in this dataset a higher BMI slightly *lowers* the estimate. The page therefore lists such answers under "Pushing your estimate down" with a warning that they must not be read as protective.

See [limitations.md](limitations.md) for what these results do and do not support.
