import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="access-error-page">
      <div className="card access-error-card">
        <div className="access-error-icon">
          <SearchX size={22} />
        </div>
        <h2>Page not found</h2>
        <p>The requested workspace page does not exist or is no longer available.</p>
        <Link className="btn btn-primary" href="/dashboard">
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
