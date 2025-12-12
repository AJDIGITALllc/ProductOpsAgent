# UI Features Documentation

## Task 5: UI Operational Clarity

The admin UI implements all required features for operational clarity.

### Features Implemented

#### 1. STUB MODE Banner
- **Location**: Top of the page, below header
- **Appearance**: Yellow/amber banner with warning icon (⚠️)
- **Text**: "⚠️ STUB MODE - WHOP_API_KEY not configured. Actions will be simulated."
- **Visibility**: Only shown when WHOP_API_KEY is not set in server environment
- **Purpose**: Clearly indicates to operators that API calls are simulated

#### 2. Draft vs Publish Toggle
- **Location**: Product creation form
- **Appearance**: Two-button toggle group
- **Options**: 
  - "Draft" (default, left button)
  - "Publish" (right button)
- **Behavior**: 
  - Draft: Creates plan without publish action
  - Publish: Adds publish action to end of plan
  - Only Owner role can execute plans with publish action
- **Visual State**: Active option has blue background, inactive has white

#### 3. Copy Plan JSON Button
- **Location**: Below generated plan display
- **Appearance**: Secondary button with clipboard icon (📋)
- **Text**: "📋 Copy Plan JSON"
- **Behavior**: 
  - Copies formatted JSON of current plan to clipboard
  - Shows success message: "Plan JSON copied to clipboard!"
  - Uses browser's native clipboard API

#### 4. Copy Execution JSON Button
- **Location**: Below execution result display
- **Appearance**: Secondary button with clipboard icon (📋)
- **Text**: "📋 Copy Execution JSON"
- **Behavior**: 
  - Copies formatted JSON of execution result to clipboard
  - Shows success message: "Execution JSON copied to clipboard!"
  - Only appears after plan execution

#### 5. Failure Details Display
- **Location**: In execution result card when status is FAILED
- **Appearance**: Red-tinted box with error styling
- **Contents**:
  - ❌ Header: "Execution Failed"
  - Failed step number (1-indexed for clarity)
  - Error message
  - Number of completed steps before failure
- **Example**:
  ```
  ❌ Execution Failed
  Failed at step: 3
  Error: API rate limit exceeded
  Completed steps: 2
  ```

### Login Screen

The UI starts with a simple login screen:
- Email input (any email accepted in demo mode)
- Password input (any password accepted in demo mode)
- Role selector (User or Owner)
- Login button

### Main Interface Layout

1. **Header**
   - Application title: "ProductOps Agent"
   - User info: "Logged in as: [email] ([role])"
   - Logout button

2. **Status Messages**
   - Success messages (green)
   - Error messages (red)
   - Info messages (blue)

3. **Product Creation Form**
   - Product Name input
   - Price input (validates > 0)
   - Currency dropdown (USD, EUR, GBP)
   - Billing Interval dropdown (monthly, yearly, weekly, one_time)
   - Draft/Publish toggle
   - FAQ management:
     - Question and Answer inputs
     - "Add FAQ" button
     - List of added FAQs with Remove buttons
   - "Create Plan" button

4. **Generated Plan Card**
   - Plan metadata (ID, status, action count)
   - Status badge (color-coded: yellow=PENDING, blue=APPROVED, green=EXECUTED, red=FAILED)
   - JSON display with syntax highlighting (dark theme)
   - Action buttons:
     - "Copy Plan JSON" button (always visible)
     - "Approve Plan" button (when status is PENDING)
     - "Execute Plan" button (when status is APPROVED)

5. **Execution Result Card**
   - Status badge
   - Failure details box (if failed)
   - JSON display of execution result
   - "Copy Execution JSON" button

### Status Badge Colors

- **PENDING**: Yellow/amber background
- **APPROVED**: Blue background
- **EXECUTING**: Purple background
- **EXECUTED**: Green background
- **FAILED**: Red background

### Responsive Design

- Maximum width: 1200px
- Centered layout
- Card-based design with shadows
- Clean, professional appearance
- Good spacing and typography

### Accessibility

- Clear labels on all form inputs
- High contrast text
- Large clickable areas on buttons
- Descriptive button text
- Color coding supplemented with icons and text

## Testing the UI

To see the UI in action:

1. Start the server: `cd packages/server && npm start`
2. Start the UI: `cd packages/ui && npm run dev`
3. Open browser to http://localhost:3000
4. Login with any credentials (choose Owner role to test publish)
5. Create a product plan
6. Approve and execute the plan
7. Observe all features in action
