import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE
import joblib
import os

# Load data
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../'))
data_path = os.path.join(project_root, 'resources', 'healthcare-dataset-stroke-data.csv')
df = pd.read_csv(data_path)
print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# Drop ID
df = df.drop('id', axis=1)

# Impute missing BMI
imputer = SimpleImputer(strategy='median')
df['bmi'] = imputer.fit_transform(df[['bmi']])
print("BMI imputed with median:", df['bmi'].median())

# Encode categoricals
label_encoders = {}
categorical_cols = ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le
    print(f"Encoded {col}: Unique values = {len(le.classes_)}")

# Features and target
X = df.drop('stroke', axis=1)
y = df['stroke']
print(f"Stroke distribution: {y.value_counts(normalize=True).round(3)}")

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# SMOTE for imbalance
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"Post-SMOTE train: {X_train_res.shape[0]} samples, balanced")

# Train RF
model = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
model.fit(X_train_res, y_train_res)

# Evaluate
y_pred = model.predict(X_test)
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Save artifacts
artifacts_dir = os.path.join(project_root, 'models')
os.makedirs(artifacts_dir, exist_ok=True)
joblib.dump(model, os.path.join(artifacts_dir, 'stroke_model.pkl'))
joblib.dump(label_encoders, os.path.join(artifacts_dir, 'label_encoders.pkl'))
joblib.dump(imputer, os.path.join(artifacts_dir, 'imputer.pkl'))
print(f"Model and artifacts saved to {artifacts_dir}")