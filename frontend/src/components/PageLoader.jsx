// components/PageLoader.jsx
import "./PageLoader.css";

export default function PageLoader({ show }) {
  return (
    <div className={`page-loader ${show ? "show" : ""}`}>
  <div className="heart-loader">
    <svg viewBox="0 0 24 24">
      <path d="M12 21s-6.2-4.35-9.33-8.48C-1.59 7.39 
               1.39 2 6.05 2 8.53 2 10 4 12 6c2-2 3.47-4 
               5.95-4 4.66 0 7.64 5.39 3.38 10.52C18.2 
               16.65 12 21 12 21z"/>
    </svg>
  </div>
</div>

  );
}
