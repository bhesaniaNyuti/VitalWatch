# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Firebase Live Data Setup

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase project credentials.
3. Start the app with `npm run dev`.

The dashboard listens to one Firestore document (default path: `dashboard/live`).
You can change the path with `VITE_FIREBASE_DASHBOARD_DOC` in `.env`.

### Expected Firestore Document Shape

```json
{
	"bpTrend": [
		{ "time": "10:43pm", "sys": 120, "dia": 82 },
		{ "time": "12:43am", "sys": 116, "dia": 68 }
	],
	"devicesOnline": 6,
	"patients": [
		{
			"id": "P001",
			"ini": "RK",
			"name": "Rajesh Kumar",
			"age": 58,
			"sex": "Male",
			"bg": "O+",
			"location": "Room 101",
			"bp": "162/105",
			"sys": 162,
			"dia": 105,
			"hr": 92,
			"spo2": 94,
			"glucose": 164,
			"chol": 212,
			"status": "Critical",
			"upd": "2 min ago",
			"department": "Cardiology",
			"registered": "12 Jan, 2022",
			"appointment": 41,
			"bed": "#0101",
			"medHx": "Hypertension, Stage 2 CKD",
			"meds": "Amlodipine, Lisinopril",
			"allergies": "Penicillin",
			"emergency": "+91-9876543210 (Wife)",
			"risk": "High - BP spike detected"
		}
	],
	"alerts": [
		{
			"id": 1,
			"type": "critical",
			"patient": "Rajesh Kumar",
			"msg": "Systolic BP 162 mmHg",
			"time": "2 min ago",
			"unread": true
		}
	],
	"patientHistory": {
		"P001": [
			{
				"date": "08 Mar, 2026",
				"diagnosis": "Hypertensive Episode",
				"severity": "High",
				"visits": 9,
				"status": "Under Treatment"
			}
		]
	}
}
```

If Firebase env variables are missing, the UI automatically falls back to local sample data.
