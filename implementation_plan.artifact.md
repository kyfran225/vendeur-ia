# Fix UI Overlap in Admin Dashboard Header

The "MASTER CONTROL" badge in the admin header overlaps with the navigation tabs because the navigation container has a restrictive `max-w-2xl` (672px) which is insufficient for the 8 tabs it contains. This causes the navigation to visually overflow its container and collide with the badge.

## Proposed Changes

### Admin Dashboard Component

#### [MODIFY] [AdminDashboard.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/admin/AdminDashboard.tsx)
- Increase `max-w-2xl` to `max-w-5xl` on the navigation container.
- Add `min-w-0` to allow the container to shrink and trigger the `overflow-x-auto` on the `nav` element instead of overflowing visually.
- Adjust the `nav` width to `w-fit` consistently on desktop to avoid unnecessary stretching while still allowing scrolling if the container is too narrow.

## Verification Plan

### Manual Verification
- Open the admin dashboard on various screen sizes.
- Verify that the "MASTER CONTROL" badge no longer overlaps with the "AI Brain" or "System" tabs.
- Verify that horizontal scrolling kicks in for the tabs when the window is narrowed.
