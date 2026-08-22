# DayflowXNMIT 🚀

**DayflowXNMIT** is an Odoo-powered management and workflow automation platform customized for **Nitte Meenakshi Institute of Technology (NMIT), Bangalore**. Built on top of the open-source Odoo ERP framework, Dayflow streamlines campus administration, human resource operations, attendance tracking, and daily workflow management.

---

## 📌 Project Overview

Odoo's flexible ecosystem allows educational institutions and organizations to seamlessly digitize administrative operations. **DayflowXNMIT** bridges campus operations with modern ERP tools, providing intuitive interfaces for faculty, staff, and management at NMIT Bangalore.

Key objectives:
- **Automation**: Digitalize paper-based administrative workflows and approvals.
- **Integration**: Provide a unified platform for HR, attendance, leave management, and reporting.
- **Scalability**: Harness Odoo's modular architecture to easily integrate custom modules.

---

## ✨ Key Features

- 🏢 **HR & Personnel Management**: Centralized records for faculty, administrative staff, and department structures at NMIT.
- ⏱️ **Attendance & Time Tracking (Dayflow)**: Simplified daily check-in/check-out logs, time-off requests, and work-hour summaries.
- 📋 **Leave & Approval Workflows**: Automated multi-level approval hierarchies for leaves, duty permissions, and campus requests.
- 📊 **Analytics & Interactive Dashboards**: Visual reporting tools for department heads and administration.
- 🧩 **Modular Odoo Architecture**: Easily extendable with standard or custom Odoo apps (Projects, Expenses, Asset Management, etc.).

---

## 🛠️ Tech Stack

- **Backend Framework**: [Odoo ERP](https://www.odoo.com/) (Python)
- **Frontend**: Odoo Web Library (OWL), XML, JavaScript, Bootstrap
- **Database**: PostgreSQL
- **Environment**: Python 3.10+, PostgreSQL 12+

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- Python 3.10+
- PostgreSQL
- Git

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vedeshskhatri/DayflowNMIT.git
   cd DayflowNMIT
   ```

2. **Set up a Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure PostgreSQL & Odoo Config**:
   Create or edit your `odoo.conf` file:
   ```ini
   [options]
   db_host = localhost
   db_port = 5432
   db_user = odoo
   db_password = odoo
   addons_path = /path/to/odoo/addons,./custom_addons
   ```

5. **Run the Odoo Server**:
   ```bash
   python3 odoo-bin -c odoo.conf
   ```
   Access the web client at `http://localhost:8069`.

---

## 🏫 About NMIT Bangalore

**Nitte Meenakshi Institute of Technology (NMIT)** is an autonomous engineering college located in Bangalore, Karnataka, India. Accredited with an 'A+' Grade by NAAC and approved by AICTE, NMIT fosters innovation, research, and technical excellence across engineering and management disciplines.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve DayflowXNMIT:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the LGPL-3.0 License / Odoo Community License. See `LICENSE` for more details.
