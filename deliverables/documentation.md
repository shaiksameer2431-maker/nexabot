# NECN Smart College Information Chatbot - System Documentation

This document serves as the comprehensive engineering guide for deploying, running, and managing the **Narayana Engineering College, Nellore (NECN) Smart College Information Chatbot System**.

---

## 1. Entity-Relationship (ER) Diagram

The system stores rules, users, categories, departments, faculty, and chat interactions in a highly optimized relational database schema.

```
+------------------+             +-------------------+             +------------------+
|    CATEGORIES    |             |   DEPARTMENTS     |             |     FACULTY      |
+------------------+             +-------------------+             +------------------+
| PK | id (VCH)    |             | PK | id (VCH)     |             | PK | id (VCH)    |
|    | name        |             |    | name         |             |    | name        |
|    | description |             |    | contact_no   |             |    | designation |
|    | created_at  |             |    | email        |             | FK | dept_id     |-----> [DEPARTMENTS]
+------------------+             |    | location     |             |    | email       |
                                 |    | created_at   |             |    | contact     |
                                 +-------------------+             +------------------+
                                           ^
                                           | (1:N Related Department)
                                           |
                                 +-------------------+             +------------------+
                                 |  KNOWLEDGE_BASE   |             |     CHAT_LOGS    |
                                 +-------------------+             +------------------+
                                 | PK | id (VCH)     |             | PK | id (BIGINT) |
                                 |    | category_name|             |    | timestamp   |
                                 |    | question     |             |    | user_query  |
                                 |    | keywords     |             | FK | rule_id     |-----> [KNOWLEDGE_BASE]
                                 |    | synonyms     |             |    | matched_ques|
                                 |    | answer       |             |    | match_score |
                                 | FK | dept_id      |             |    | user_role   |
                                 |    | priority     |             |    | fallback    |
                                 |    | status       |             +------------------+
                                 +-------------------+

                                 +-------------------+
                                 |       USERS       |
                                 +-------------------+
                                 | PK | id (BIGINT)  |
                                 |    | username     |
                                 |    | password_hash|
                                 |    | full_name    |
                                 |    | email        |
                                 |    | role (ADMIN) |
                                 +-------------------+
```

---

## 2. API Documentation

### A. Public Chatbot Endpoints
All requests are cross-origin enabled (`@CrossOrigin`) for direct communication with the React frontend.

#### 1. Ask a Question
* **Endpoint:** `POST /api/chat/query`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "query": "Who is CSE HOD?",
    "role": "Student"
  }
  ```
* **Success Response (200 OK - Match Found):**
  ```json
  {
    "answer": "The Head of the Department (HOD) of Computer Science and Engineering (CSE) is Dr. C. Rajendra. His office is located on the 1st Floor of Bhabha Block. Contact: cse.hod@necn.ac.in.",
    "matchedRuleId": "R7",
    "score": 15.0,
    "fallbackTriggered": false,
    "timestamp": "2026-07-07T00:24:15.123",
    "departmentContact": {
      "name": "Computer Science and Engineering",
      "phone": "+91-861-2313889 (Ext: 102)",
      "email": "cse.hod@necn.ac.in"
    }
  }
  ```
* **Success Response (200 OK - Fallback Triggered):**
  ```json
  {
    "answer": "I couldn't find the requested information in the college knowledge base. Please contact the respective department for further assistance.",
    "matchedRuleId": null,
    "score": 0.0,
    "fallbackTriggered": true,
    "timestamp": "2026-07-07T00:24:17.332",
    "departmentContact": null
  }
  ```

---

### B. Administrative Endpoints
Protected by Admin Session/Token verification.

#### 1. Upload Excel Knowledge Base
* **Endpoint:** `POST /api/admin/rules/import`
* **Content-Type:** `multipart/form-data`
* **Request Parameter:** `file` (MultipartFile - standard Excel `.xlsx`)
* **Description:** Reads row data via Apache POI, validates schema layout, purges old rules, and live-reloads rules into database memory.
* **Response (200 OK):**
  ```json
  {
    "message": "Successfully imported 48 college rules into the chatbot database.",
    "status": "Success",
    "importedCount": 48
  }
  ```

#### 2. Export Rules to Excel
* **Endpoint:** `GET /api/admin/rules/export`
* **Description:** Builds a downloadable `.xlsx` workbook using Apache POI containing all active/inactive rules.
* **Response (200 OK):** Streamed Octet Binary Excel sheet file download.

#### 3. Standard Rule CRUD (JSON APIs)
* `GET /api/admin/rules`: List all rule records with query search filters.
* `POST /api/admin/rules`: Manually register a single custom rule.
* `PUT /api/admin/rules/{id}`: Modify an existing rule record.
* `DELETE /api/admin/rules/{id}`: Unlink and remove a rule from the database.

---

## 3. Installation & Setup Guide

### Backend (Spring Boot + MySQL)

#### Prerequisites
1. **Java Development Kit (JDK):** Version 17 or higher.
2. **Build Tool:** Apache Maven 3.8+ or Gradle 7.x+.
3. **Database Server:** MySQL 8.x.

#### Step 1: Database Setup
Login to your MySQL terminal and run the `/deliverables/mysql-schema.sql` file:
```bash
mysql -u root -p < mysql-schema.sql
```

#### Step 2: Configure Spring Boot `application.properties`
Navigate to `src/main/resources/application.properties` in your Spring Boot workspace and fill in your connection variables:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/necn_chatbot_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YourMySqlSecurePassword

# Hibernate configurations
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# File upload thresholds
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB
```

#### Step 3: Add Excel Parsing Dependencies (Maven `pom.xml`)
Inject Apache POI dependencies:
```xml
<dependencies>
    <!-- Apache POI for Excel Parsing (.xlsx files) -->
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi-ooxml</artifactId>
        <version>5.2.3</version>
    </dependency>
    <!-- Spring Boot JPA & MySQL Connector -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

#### Step 4: Build and Boot
Compile and start the Spring Boot application server:
```bash
mvn clean install
mvn spring-boot:run
```
The server will boot, run on port `8080` (or your configured port), and wait for incoming frontend traffic.

---

### Frontend (React + Vite)

#### Prerequisites
1. **Node.js:** LTS (v18 or v20).
2. **Package Manager:** npm or yarn.

#### Step 1: Installation
Install all dependencies:
```bash
npm install
```

#### Step 2: Start Local Dev Server
Launch Vite to run the web application locally:
```bash
npm run dev
```
Open `http://localhost:3000` inside your browser.

---

## 4. Deployment Guide

### Deploying the App to Production Cloud Containers (e.g., Cloud Run)

The application is completely containerized. The repository includes configurations for a fully compiled environment:

1. **Docker Container Construction:**
   Build the single production-ready Docker image containing both static assets and reverse routing proxy:
   ```bash
   docker build -t gcr.io/necn-college-project/chatbot-app:latest .
   ```

2. **Container Launch:**
   Push the container image to Google Artifact Registry and trigger Cloud Run deployment:
   ```bash
   gcloud run deploy necn-chatbot-service \
       --image gcr.io/necn-college-project/chatbot-app:latest \
       --platform managed \
       --region asia-east1 \
       --allow-unauthenticated
   ```

3. **Domain Mapping:**
   Bind your deployed Cloud Run URL to your college main domain (e.g., `chatbot.necn.ac.in`) using the Google Cloud Domain Mapping panel, then copy the floating script tag onto the college landing page!
