# stroke-prediction-app
The app has three main parts: Model Training (one-time), Backend (API server), and Frontend (UI). Run them in order. Assumptions: Python 3.8+ installed, dependencies via pip, and dataset CSV in model-training/resources/.
1. Model Training Module
This trains the Random Forest model on the Kaggle dataset and saves artifacts (.pkl files) for the backend.
Steps to Run:

Navigate to the folder: cd stroke-prediction-app/model-training
Install dependencies: pip install -r requirements.txt (needs pandas, scikit-learn, joblib, imbalanced-learn).
Run the script: python src/main/python/train_model.py
It loads the CSV from resources/, preprocesses (impute BMI, encode categories, SMOTE for balance), trains RF, evaluates, and saves to models/.


Expected Output (in terminal):
textDataset loaded: 5110 rows, 12 columns
BMI imputed with median: 28.1
...
Post-SMOTE train: 9732 samples, balanced
Classification Report:
              precision    recall  f1-score   support

           0       0.95      0.96      0.96       972
           1       0.30      0.24      0.27        50

    accuracy                           0.92      1022
   macro avg       0.62      0.60      0.61      1022
weighted avg       0.91      0.92      0.92      1022

Model and artifacts saved to /path/to/stroke-prediction-app/model-training/models
How to Test:

Check models/ folder: Should have stroke_model.pkl, label_encoders.pkl, imputer.pkl.
Manually verify report: High accuracy (~92%), but focus on recall for class 1 (strokes: ~0.24—normal due to imbalance; SMOTE helps).
Rerun with changes: Edit hyperparameters in code (e.g., n_estimators=200), run again, compare reports.

Copy Artifacts: Manually copy models/ contents to backend/models/ for API use.
2. Backend App (Flask API)
This loads the model and serves predictions via /predict POST.
Steps to Run:

Navigate: cd stroke-prediction-app/backend
Install dependencies: pip install -r requirements.txt (flask, pandas, scikit-learn, joblib, flask-cors).
Ensure artifacts in models/ (from training).
Run: python src/main/python/app.py
Starts server: Running on http://0.0.0.0:5000 (Press CTRL+C to quit)


Expected Output:
text* Serving Flask app 'app'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
How to Test:

Manual Test (Curl/Postman): Send sample POST:textcurl -X POST http://localhost:5000/predict \
-H "Content-Type: application/json" \
-d '{
  "gender": "Male",
  "age": 50,
  "hypertension": 1,
  "heart_disease": 0,
  "ever_married": "Yes",
  "work_type": "Private",
  "Residence_type": "Urban",
  "avg_glucose_level": 100.0,
  "bmi": 25.0,
  "smoking_status": "never smoked"
}'
Expected: {"stroke_prob":0.07} (float between 0-1; varies by input).

Error Test: Send missing field (e.g., no "age"): Expect {"error":"Missing required fields"} (400).
Debug Mode: If error, browser shows traceback (enter PIN from terminal if prompted).
Load Test: Use tools like locust (pip install locust): Create locustfile.py with POST tasks, run locust → test 10 concurrent users.

3. Frontend App (UI)
Static site with stepper form; calls backend on submit.
Steps to Run:

Navigate: cd stroke-prediction-app/frontend/web
Start simple server: python -m http.server 8000
Opens at http://localhost:8000


Expected Output (terminal):
textServing HTTP on 0.0.0.0 port 8000[](http://0.0.0.0:8000/) ...
How to Test:

Open browser: http://localhost:8000 → See header "Stroke Sentinel".
Full Flow: Step through 10 questions (validate each: e.g., age <0 shows error).
Submit: Loading spinner → Result (e.g., "Low Risk 7%" with message).

Edge Cases: Invalid inputs (e.g., BMI 5: error); Back/Next navigation (saves/loads data).
API Integration: Ensure backend running; change script.jsbackendUrl if ports differ. Test second assessment after "New Assessment" (should clear data).
Responsive Test: Resize browser or use dev tools (F12 > Toggle Device Toolbar) – Check mobile view (buttons stack, cards adjust).
Browser Console: F12 > Console/Network: No JS errors; POST to /predict succeeds (200 OK).

Full End-to-End Test

Train model → Copy artifacts.
Start backend (port 5000).
Start frontend (port 8000).
Use UI → Submit → Verify prediction matches manual curl (e.g., same inputs give same prob).
Test OpenAI feature (if added): Ensure recommendations appear in result (e.g., edit app.py to call OpenAI after prob).
