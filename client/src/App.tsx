import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import MyLists from "@/pages/my-lists";
import SharedLists from "@/pages/shared-lists";
import ListDetail from "@/pages/list-detail";
import Calendar from "@/pages/calendar";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/my-lists" component={MyLists} />
      <ProtectedRoute path="/shared-lists" component={SharedLists} />
      <ProtectedRoute path="/list/:id" component={ListDetail} />
      <ProtectedRoute path="/calendar" component={Calendar} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
