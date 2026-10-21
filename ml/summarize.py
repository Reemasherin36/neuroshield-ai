"""Write artifacts/data_summary.json: real dataset counts used by the Methodology page."""
import json

import pandas as pd

from ml import config
from ml.prepare_data import find_csv, get_splits, load_data


def main() -> None:
    df = load_data()
    raw = pd.read_csv(find_csv(), dtype=str, keep_default_na=False)  # keep "N/A" as text so it can be counted
    (X_tr, y_tr), (_, y_val), (_, y_te) = get_splits(df)
    summary = {
        "rows": len(df),
        "positives": int(df[config.TARGET].sum()),
        "positive_rate": float(df[config.TARGET].mean()),
        "bmi_na_strings": int((raw["bmi"] == "N/A").sum()),
        "bmi_missing": int(df["bmi"].isna().sum()),
        "smoking_unknown": int((df["smoking_status"] == "Unknown").sum()),
        "gender_other": int((df["gender"] == "Other").sum()),
        "age_min": float(df["age"].min()),
        "age_max": float(df["age"].max()),
        "splits": {
            name: {"rows": len(y), "positives": int(y.sum())}
            for name, y in [("train", y_tr), ("validation", y_val), ("test", y_te)]
        },
    }
    (config.ARTIFACTS_DIR / "data_summary.json").write_text(json.dumps(summary, indent=2))
    # "Typical person" used to explain a result: median for numbers, most common value for categories.
    # Taken from the training split only.
    typical = {c: float(X_tr[c].median()) for c in config.FEATURES_NUMERIC}
    for c in config.FEATURES_BINARY:
        typical[c] = int(X_tr[c].mode().iloc[0])
    for c in config.FEATURES_CATEGORICAL:
        typical[c] = str(X_tr[c].mode().iloc[0])
    (config.ARTIFACTS_DIR / "reference_profile.json").write_text(json.dumps(
        {"values": typical, "n": len(X_tr), "source": "median or most common value in the training split"}, indent=2))
    print("typical profile:", json.dumps(typical))
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
