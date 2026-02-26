# Personal Website for plsak.com

## Overview
A modern, dark-themed personal website with admin functionality for content management.

## Layout and Design
- Dark theme throughout the application
- HTML page title set to "plsak with caffeine.ai"
- Centered heading at the top with admin-editable text, font, and color (defaults to "plsak with caffeine.ai" in cursive font style)
- No description text below the page heading
- Three main content sections:
  - Right pane: Blog section
  - Top pane: Dynamic rotating information about Caffeine (stops rotation when clicked)
  - Bottom pane: Links collection
- Panel headings "About Caffeine AI", "Blog", and "Links" are centered within their respective panes for visual balance
- Admin and Logout buttons positioned in the top right corner, aligned at the same height side by side
- Display logged-in user's principal in shortened format (first 4 and last 4 characters with dots in between, e.g., abcd...wxyz) below the buttons for cleaner organization
- Copy button next to the displayed principal for easy copying of the full principal ID with "Copied!" feedback message
- Admin Management UI next to the authentication buttons with "Manage" button label when user is logged in

## Authentication
- Internet Identity integration for admin authentication
- Configurable admin list stored in backend
- Principal 'tyf5f-xp4vd-acgcy-3az6q-poccg-u2yfq-7phil-jgidl-kmwm6-477a6-mae' is always assigned admin role by default and cannot be denied access
- Non-admin users see an "Access Denied" banner but can still use the site without admin privileges
- No nickname/profile setup after login
- Admin Management UI for adding/removing admin principals
- Only existing admins can modify the admin list
- Log and display list of principals who attempted login but are not admins
- Allow existing admins to promote logged principals to admin role
- "Admin" button label for login functionality
- "Logout" button label for authenticated users

## Page Heading Management
- Admin-only functionality to edit the main page heading
- Editable heading text (defaults to "plsak with caffeine.ai")
- Font selection options for the heading
- Font color selection for the heading
- Heading settings stored in backend
- Changes apply immediately when saved

## Blog Section (Right Pane)
- Display blog posts in chronological order without author labels
- Blog post timestamps display date with UTC hour and minute (e.g., "Apr 27, 2024, 14:35 UTC")
- Full emoji support in both blog post titles and content
- Blog text must display with natural, consistent word spacing and line height matching the About Caffeine AI pane appearance
- Blog post editor must use normal word spacing without excessive gaps or tab-like spacing
- Blog post input and output must provide a natural reading experience with proper text formatting
- Admin-only functionality:
  - Add new blog posts with emoji support
  - Edit existing posts with emoji support and reliable save functionality
  - Delete posts
  - Enhanced emoji picker integrated into blog post editor for both title and content fields with:
    - "Smileys" tab for standard emoji categories
    - "Fingers" tab containing finger-related emojis (crossed fingers, thumbs up, pointing, etc.)
    - "People" tab containing people-related emojis (shrugging, face palm, and similar people emojis)
    - Search box allowing users to search for emojis by text description
  - Users can select and insert emojis directly from the picker interface
  - Inserted emojis display correctly in saved blog posts
  - Blog post editor must successfully save changes when editing existing posts
  - Blog post editor must preserve natural word spacing and display text with consistent formatting
  - Blog post creation and editing process must be protected from unexpected cancellation due to auto-refresh or query refetching
  - Ensure editing sessions remain stable and uninterrupted until user explicitly saves or cancels
- Blog posts stored in backend with title, content, and timestamp

## Caffeine Information Section (Top Pane)
- Dynamic, rotating information about Caffeine AI system
- Display information about Caffeine's capabilities and features
- Text content is not selectable for all users (visual display only)
- Content rotation stops when any user clicks on the pane
- After rotation stops, all users can click through different screens of content
- Progress indicator lines below the text showing available info screens
- Users can click on specific progress indicator lines to jump directly to corresponding info screens
- Admin-only functionality:
  - Always visible "Edit" button for admins when authenticated (no "Edit" button)
  - Edit the text content of each individual rotating screen
  - Add new screens to the rotation
  - Remove existing screens from the rotation
  - Edit the pane's title (currently "About Caffeine AI")
  - Edit functionality must be clearly accessible and work reliably for all admin operations
- Users can refresh the page to restart the rotation
- Content managed through backend storage
- Admin-editable content for updating Caffeine information

## Links Section (Bottom Pane)
- Collection of web links with titles, URLs, and descriptions displayed in a specific order
- Admin-only functionality:
  - Add new links
  - Edit existing links including descriptions with reliable save functionality that works for all links
  - Delete links
  - "Change Order" button next to "Add Link" button for entering reordering mode
  - When "Change Order" is clicked, enable drag-and-drop mode for the links
  - In reordering mode, display the current position number (1, 2, 3, ...) next to each link item to clearly indicate its intended position after saving
  - Links can be dragged and rearranged with real-time visual feedback
  - During drag operations, links must move in real-time to show the new order as the dragged link hovers over different positions
  - Other links must smoothly animate and reposition themselves to provide immediate visual feedback of where the dragged link will be placed when dropped
  - "Save" and "Cancel" buttons appear in reordering mode
  - Only after clicking "Save" should the new order be persisted to the backend and saved permanently
  - The new order must persist for all users after clicking "Save"
  - Clicking "Cancel" reverts to the original order before entering reordering mode
  - The reordering mode must maintain the temporary new order until either "Save" or "Cancel" is clicked
  - Backend must properly update and store the new link order only when "Save" is clicked
  - The saved order persists after page refresh and across all user sessions
  - All users see the updated link order immediately after an admin saves the new order
  - After rearranging links and clicking "Save," the links must be saved in exactly the order displayed in the UI, matching the position numbers shown during reordering
  - The frontend must immediately update to reflect the new order after saving
  - The new order must be visible immediately without requiring a page reload
  - Both backend and frontend must synchronize to ensure the saved order is correctly displayed with no reversal or alteration of the user-arranged order
  - When saving the new order in "Change Order" mode, the array of link IDs must be reversed before sending to the backend to ensure the saved order matches exactly what the user sees in the UI
  - The frontend must reverse the array of link IDs before calling the backend reorderWebLinks function to maintain the exact order as displayed in the UI
  - The UI must remain stable and smooth during and after saving the new order, with no unnecessary shaking or animation effects
  - Links should not shake or animate unnecessarily when the new order is saved
- Links data stored in backend with persistent order information and descriptions
- All users see links in the same order as set by admins
- Link order persists across sessions and is consistent for all users
- Link descriptions are properly associated with their respective links during reordering operations

## Admin Management
- UI interface for managing admin principals
- Site Statistics panel appears first in the Admin Management section, before other sections
- Display current list of admin principals with real-time updates using backend method that retrieves all admin principals
- Show complete and accurate list of all current admins including those added after the default
- All displayed admin principals use shortened format (first 4 and last 4 characters with dots in between, e.g., abcd...wxyz)
- Each admin principal has its own copy button that copies the correct full principal ID with "Copied!" feedback message
- Add New Admin Principal section for entering their Internet Identity with reliable assignment functionality
- When new admins are added, the displayed list immediately updates to show all current admins
- Remove existing admin principals from the list (except the default admin principal)
- Display list of principals who attempted login but are not admins in shortened format
- Promote non-admin principals to admin role directly from the list
- Only accessible to current admins
- Real-time updates to admin permissions
- Clean modal interface without informational text under the line
- Display site visit counter under the "Admins" section, labeled as "Visited:"
- Display all canister IDs used by the app, including both backend and frontend canisters, in shortened format (first 4 and last 4 characters with dots in between) with individual copy-to-clipboard buttons
- Each canister ID copy button copies the correct full canister ID and displays "Copied!" feedback message
- All copy buttons throughout the Admin Management section must copy their respective correct values, not always the first one

## Copy Button Functionality
- All copy buttons throughout the application must copy the correct associated value
- After successful copy action, display a light "Copied!" feedback message near the button using a lighter background color that matches the current dark theme instead of green for a more visually integrated and pleasant appearance
- "Copied!" feedback appears for all copy buttons including:
  - User principal copy button
  - Admin principal copy buttons in Admin Management
  - Canister ID copy buttons in Admin Management
- Feedback message provides clear user confirmation of successful copy action with theme-appropriate styling

## Site Visit Counter
- Backend counter that accurately increments each time the site is visited
- Visit count displayed in Admin Management section
- Counter must increment on every page load across different browsers and sessions
- Counter persisted in backend storage with reliable increment mechanism
- Ensure proper tracking of unique visits and page loads

## Backend Data Storage
- Blog posts with metadata (title, content, timestamp with UTC hour and minute) supporting emoji characters
- Web links collection (title, URL, description) with persistent order information for reordering functionality
- Multiple Caffeine information entries for rotation display with individual screen content
- Customizable pane title for Caffeine information section
- Admin principals list for access control with default admin principal protection
- Log of non-admin login attempts with principal IDs
- Backend method to retrieve all current admin principals by iterating through user roles and collecting admin role assignments
- Site visit counter with reliable increment functionality that properly tracks all site visits
- Page heading configuration (text, font, color)
- Backend must support reliable updating of existing blog posts with proper data persistence
- Backend must support storing and retrieving custom link order with persistence only when explicitly saved through the "Save" button in reordering mode
- Link order data must be maintained consistently across all user sessions and page loads with real-time updates for all users
- Backend must ensure link descriptions are properly associated with their respective links during reordering operations
- Backend must reliably save link description edits with proper data persistence, ensuring all links including the last link have their description changes saved correctly
- Backend must save the new link order only when the "Save" button is clicked in reordering mode, not during the drag-and-drop preview
- Backend reorderWebLinks function must be called only when "Save" is clicked and must permanently save the new order with proper persistence for all users
- Backend must correctly save and persist the new link order after rearranging links in "Change Order" mode and clicking "Save"
- Backend must ensure that when the new link order is saved, it becomes the permanent order that preserves the exact arrangement as displayed in the UI
- Frontend must immediately reflect the saved order changes without requiring a page reload, ensuring synchronization between backend and frontend state
- Backend must save links in exactly the order received from the frontend after the array reversal, maintaining precise position accuracy

## Static Asset Configuration
- Remove all duplicate, empty, or unused static asset files from the entire codebase
- Place exactly one copy of each required static file at the root of the backend canister source directory:
  - Single `.ic-assets.json5` file with content: [{"match": ".well-known", "ignore": false}]
  - Single `.well-known/ic-domains` file with content: www.plsak.com
  - Single `.well-known/ii-alternative-origins` file with content: {"alternativeOrigins":["https://www.plsak.com"]}
- These files must be served as static assets from the backend canister
- Files must be accessible via HTTP GET requests for domain verification
- Configure proper Content-Type headers for .well-known directory files to be served as "text/plain"
- Static assets must be included in the backend build output and deployment
- A GET request to the backend canister URL at /.well-known/ic-domains must return exactly "www.plsak.com", not index.html
- A GET request to the backend canister URL at /.well-known/ii-alternative-origins must return the correct JSON content, not index.html
- Ensure static asset serving takes precedence over dynamic routing for .well-known paths
- Verify that all static files contain the correct required content and are not empty
- Ensure proper file structure and content for domain verification and Internet Identity support

## Content Language
- All content and interface in English
