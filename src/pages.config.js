/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccessControl from './pages/AccessControl';
import AgentDashboard from './pages/AgentDashboard';
import Activities from './pages/Activities';
import Dashboard from './pages/Dashboard';
import Deposits from './pages/Deposits';
import Home from './pages/Home';
import ImportHistory from './pages/ImportHistory';
import LeadProfile from './pages/LeadProfile';
import Leads from './pages/Leads';
import Profile from './pages/Profile';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccessControl": AccessControl,
    "AgentDashboard": AgentDashboard,
    "Activities": Activities,
    "Dashboard": Dashboard,
    "Deposits": Deposits,
    "Home": Home,
    "ImportHistory": ImportHistory,
    "LeadProfile": LeadProfile,
    "Leads": Leads,
    "Profile": Profile,
    "Reminders": Reminders,
    "Reports": Reports,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Leads",
    Pages: PAGES,
    Layout: __Layout,
};