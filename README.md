# ⚖️ Bias Auditor — Risk Score Fairness Dashboard

> **Live Demo:** [https://bias-app.vercel.app/](https://bias-app.vercel.app/)

A full-stack interactive dashboard for detecting and visualizing bias in AI risk scoring models. Audit your model's fairness across **race/ethnicity**, **gender**, and **age group** dimensions using industry-standard bias metrics — powered by an AI analysis engine built on **Llama 3.3 70B via Groq**.

---

## 📸 Preview

![Bias Auditor Dashboard](https://bias-app.vercel.app/og-preview.png)

---

## ✨ Features

- 📊 **Disparate Impact Analysis** — Flags groups using the 4/5ths rule (DI < 0.8 or > 1.25 = discriminatory)
- 📉 **Error Rate Disparity** — False positive and false negative rates broken down by demographic group
- 🔥 **Score Heatmap** — Average risk scores at the Race × Gender intersection
- 🕸️ **Fairness Radar Chart** — Multi-metric group comparison in one view
- 🤖 **AI Bias Audit** — One-click plain-language interpretation of all bias metrics using Llama 3.3 70B
- 📁 **CSV Upload** — Drop in your own dataset for instant analysis
- 🎲 **Synthetic Data Generator** — Built-in data generation (100–2000 records) with intentional bias patterns for testing
- 📱 **Fully Responsive** — Works on desktop, tablet, and mobile

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Aditya-kukreti-ba/Bias-app.git
cd Bias-app

# 2. Install dependencies
npm install

# 3. Create environment file
echo "VITE_GROQ_API_KEY=your_groq_key_here" > .env

# 4. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing with Sample Data

A ready-made CSV file is included for testing. It contains 200 records with intentionally embedded bias patterns across all demographic groups.

**Required CSV columns:**

| Column | Values |
|--------|--------|
| `race` | White, Black, Hispanic, Asian, Other |
| `gender` | Male, Female, Non-binary |
| `ageGroup` | 18-25, 26-35, 36-50, 51-65, 65+ |
| `riskScore` | 0–100 |

Upload it via the **📁 Upload CSV** button in the dashboard.

---

## 📐 Bias Metrics Explained

| Metric | Description | Threshold |
|--------|-------------|-----------|
| **Disparate Impact (DI)** | Ratio of high-risk flagging rates between groups | 🟢 0.8–1.25 = Fair · 🟡 Borderline · 🔴 Discriminatory |
| **False Positive Rate (FPR)** | Rate of incorrectly flagging low-risk individuals as high-risk | Lower is better |
| **False Negative Rate (FNR)** | Rate of missing truly high-risk individuals | Lower is better |
| **Average Risk Score** | Mean score per demographic group | Should be similar across groups |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React + Vite |
| Charts | Recharts |
| AI Engine | Llama 3.3 70B via Groq API (free) |
| Styling | Inline CSS with warm editorial theme |
| Fonts | Playfair Display + DM Sans |
| Deployment | Vercel |

---

## 🌐 Deployment on Vercel

1. Push your code to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add environment variable in Vercel dashboard:
   - **Key:** `VITE_GROQ_API_KEY`
   - **Value:** your Groq API key
4. Deploy — done!

---

## ⚠️ Security Notes

- Never hardcode API keys in your source code
- The `.env` file is git-ignored and stays local
- Groq API key is injected at build time via `import.meta.env.VITE_GROQ_API_KEY`
- For production apps, route API calls through a backend server

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙌 Acknowledgements

- [Groq](https://groq.com) for the free, blazing-fast LLM API
- [Recharts](https://recharts.org) for the charting library
- [Vercel](https://vercel.com) for free hosting

---

<p align="center">Built with ❤️ · <a href="https://bias-app.vercel.app/">Live Demo</a></p>
