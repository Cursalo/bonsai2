# PRD: Bonsai Prep – Student Mistake Upload & Personalized Quiz Workflow

**Version:** 1.0
**Date:** 2023-10-27
**Author:** [Your Name/Team]

## 1. Introduction & Overview

This document outlines the requirements for a new feature in Bonsai Prep designed to provide personalized learning pathways for students based on the questions they miss on official SAT practice tests. The core flow involves students uploading their missed questions, the system matching these to internally modeled questions, generating a custom quiz, providing targeted remediation (video lessons, follow-up questions), and visually tracking skill mastery on the student's dashboard via a growing bonsai tree metaphor.

## 2. Goals

*   Provide a personalized and adaptive learning experience based on individual student weaknesses identified from official SAT practice tests.
*   Increase student engagement through dynamic quiz generation and visual progress tracking (bonsai tree).
*   Improve student understanding of specific SAT concepts by delivering targeted video explanations and reinforcement exercises.
*   Efficiently utilize the internal bank of modeled SAT questions.
*   Maintain compliance by not storing or directly using official College Board question content.

## 3. User Stories

*   **As a student,** I want to upload the list of questions I missed on an official SAT practice test so that I can get targeted practice on those concepts.
*   **As a student,** I want to take a custom quiz focused specifically on the areas where I struggled.
*   **As a student,** after taking the custom quiz, I want to receive clear explanations (like videos) for the questions I still got wrong so I can understand the underlying concepts.
*   **As a student,** I want to practice the concepts I missed further with additional questions to ensure I've grasped them.
*   **As a student,** I want to see my progress visually represented (like a growing bonsai tree) so I feel motivated and understand which skills I've mastered.

## 4. Functional Requirements

### 4.1 Step 1: Student Uploads Missed Questions
    *   **FR1.1:** The system must allow students to indicate missed questions from specific official SAT practice tests (e.g., Bluebook tests).
    *   **FR1.2:** Input methods should support file uploads (PDF, image formats like JPG/PNG) and/or manual form entry.
    *   **FR1.3:** The system must extract identifying information for each missed question (e.g., Test ID, Section Number/Type, Question Number).
    *   **FR1.4:** The system must *not* store the actual content of the official SAT questions. Only identifiers should be stored.

### 4.2 Step 2: Backend Cross-References Modeled Questions
    *   **FR2.1:** Maintain a database mapping internal modeled questions to specific official SAT question identifiers.
    *   **FR2.2:** Each modeled question must be original content designed to test the same skill/concept as its mapped official counterpart.
    *   **FR2.3:** For each missed official question identifier submitted by the student, the system must retrieve the corresponding internal modeled question(s) from the database.

### 4.3 Step 3: Bonsai Generates a Custom Quiz
    *   **FR3.1:** The system must dynamically generate a custom quiz for the student.
    *   **FR3.2:** The quiz must contain one unique modeled question corresponding to each of the student's originally uploaded missed questions.
    *   **FR3.3:** The generated quiz must be presented to the student via their dashboard or a dedicated interface.

### 4.4 Step 4: Post-Quiz Analysis & Remediation
    *   **FR4.1:** The system must evaluate the student's performance on the custom quiz, identifying correct and incorrect answers against the modeled questions.
    *   **FR4.2:** For each *incorrectly* answered modeled question on the custom quiz:
        *   **FR4.2.1:** The system must provide the student access to a short, AI-generated video lesson explaining the specific skill/concept tested by that question.
        *   **FR4.2.2:** (Optional) The system may provide access to a supplementary PDF explanation or visual aid for the concept.
        *   **FR4.2.3:** The system must generate and present 3 additional, unique Bonsai modeled questions targeting the *same* skill/concept for reinforcement.
    *   **FR4.3:** The system must track the student's completion of viewing the video lesson and answering the 3 follow-up questions.

### 4.5 Step 5: Skill Tracking & Dashboard Update
    *   **FR5.1:** Based on the student's performance on the 3 follow-up questions (and potentially the initial custom quiz answer), the system must determine if the skill/concept has been mastered. (Define mastery criteria - e.g., 2 out of 3 correct).
    *   **FR5.2:** If mastery is achieved, the system must log this skill as "pruned/refined" (or similar status) in the student's profile.
    *   **FR5.3:** Upon skill mastery, the system must trigger an update to the student's dashboard, visually representing the gained skill on their bonsai tree (e.g., "growing a new branch").
    *   **FR5.4:** The visual representation (e.g., the branch) should ideally be interactive, potentially linking to review materials or displaying the concept name (e.g., upon hover/click).

## 5. Data Handling & Storage

*   Student-uploaded missed question identifiers (Test ID, Section, Question #).
*   Mapping table: Official SAT Question ID <-> Internal Modeled Question ID.
*   Internal Modeled Question Bank (Question text, answer choices, correct answer, concept tags, associated video lesson ID, associated PDF ID).
*   Student quiz results (Quiz ID, User ID, Modeled Question ID, Answer Submitted, Correct/Incorrect).
*   Student progress data (User ID, Mastered Skill/Concept ID, Date Mastered).
*   Video and PDF content storage and retrieval mechanism.
*   Strict adherence to *not* storing official College Board question content.

## 6. Design & UI/UX Considerations

*   **Upload Interface:** Simple, intuitive interface for selecting the test and entering/uploading missed questions. Clear instructions. Error handling for invalid inputs.
*   **Quiz Interface:** Clean, standard quiz interface. Clear indication of progress. Timer (if applicable).
*   **Remediation Flow:** Seamless transition from missed quiz question to video lesson and follow-up questions.
*   **Dashboard:** Clear display of the bonsai tree. Visual feedback for skill mastery (branch growth). Interactivity for reviewing mastered skills.

## 7. Optional Features / Future Considerations

*   **Branch Growth Animation:** Implement a visually appealing animation when a new branch grows on the bonsai tree.
*   **Detailed Skill Tagging:** Assign granular tags (e.g., `punctuation:comma_usage`, `algebra:linear_equations`, `reading:tone_analysis`) to modeled questions, videos, and skills for finer tracking and reporting.
*   **Internal Traceability:** Log which specific official question initiated a particular learning path for internal analysis and improvement, ensuring this data is not exposed to the student.
*   **Confidence Scoring:** Allow students to rate their confidence before/after questions or lessons.
*   **Spaced Repetition:** Integrate mastered concepts into future reviews using spaced repetition principles.
*   **Advanced Upload Parsing:** Use OCR or more advanced parsing for uploaded files to reduce manual entry.

## 8. Key Development Requirements (Summary)

*   Robust mapping system (Official QID <-> Modeled QID).
*   Dynamic custom quiz generator engine.
*   Backend integration for serving video/PDF content.
*   Backend logic for tracking quiz performance, remediation completion, and skill mastery.
*   Dashboard component capable of dynamically rendering and updating the bonsai tree visualization based on user skill mastery data.
*   Secure and efficient data storage for user progress and the question bank.

## 9. Open Questions & Assumptions

*   **Assumption:** We have a sufficiently large and well-tagged bank of internal modeled questions mapped to official SAT questions.
*   **Assumption:** AI video generation capabilities are available and can produce relevant, concise explanations for specific skills.
*   **Question:** What are the specific criteria for "mastery" based on the 3 follow-up questions? (e.g., 2/3 correct? 3/3 correct?)
*   **Question:** How will the initial set of official SAT tests and their identifiers be managed and updated?
*   **Question:** What are the specific requirements for the format/content of the AI-generated videos? Length? Style?
*   **Question:** How will PDF explanations be generated or sourced?

--- 