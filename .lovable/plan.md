## Attendance & HR Management System Implementation Plan

This is a comprehensive and well-structured spec! Since we are building this within the existing educational platform, we will integrate it as a powerful new suite of modules accessible to Admins, Staff, and Students, complementing the existing LMS and quiz features.

Here is the step-by-step plan to build this out:

### Phase 1: Database Schema & Setup

- Execute Supabase migrations to create the required tables: `students`, `staff`, `shifts`, `student_attendance`, `staff_attendance`, `student_leaves`, `staff_leaves`, `staff_leave_balance`, `holidays`, and `overtime_records`.
- Setup Row Level Security (RLS) policies ensuring data privacy (e.g., students only see their own attendance, staff see their own check-ins/leaves, admins manage all).
- Generate corresponding TypeScript types (`interfaces.ts`) for the frontend.

### Phase 2: Core Navigation & Dashboards

- **Routing Setup**: Add new routes in `src/App.tsx` (e.g., `/admin/attendance`, `/admin/hr`, `/staff/check-in`, `/student/attendance`).
- **Dashboard UIs**: 
  - Admin Overview: Today's stats (Present/Absent/Late), pending leaves, quick actions.
  - Staff/Student Overview: Personal attendance calendar and leave balances.
- **Sidebar Integration**: Add the Attendance and HR sections to the `AppSidebar` and `MobileBottomNav`.

### Phase 3: Student Attendance Module

- **Daily Marking Tool**: Build the class/section selection interface with a roster view. Implement the "Mark All Present" bulk action and individual override toggles (Present/Absent/Late/Half-day).
- **Calendar & Reports**: Build the color-coded monthly calendar view for students and the class-wise percentage reports for teachers/admins.

### Phase 4: Staff HR & Attendance Module

- **Self Check-In Portal**: Build the time-stamped check-in/check-out UI for staff.
- **Admin Staff Tracking**: A centralized view for admins to monitor staff arrival times, absences, and apply remarks.
- **Shift & Roster Management**: UI to define working hours, late thresholds, and assign staff to specific shifts.

### Phase 5: Leave Management System

- **Application Forms**: Build intuitive forms for submitting casual, sick, and earned leave requests with document attachment support.
- **Approval Workflow**: Create a dedicated queue for admins to approve/reject pending leaves.
- **Balance Tracking**: Visual indicators for remaining leave allowances.

### Phase 6: Analytics & Notifications

- Implement Recharts-based visualizations (Attendance Trends, Class Comparisons).
- Set up the notification scaffolding (using the existing `user_notifications` system) to alert users on leave status changes or low attendance.

**Let's start with Phase 1 and 2.** Once approved, I will run the database migrations to set up the foundation and build the main dashboard layouts.

**this is tool and will be in placed in tool menu allow user to add institute name.**