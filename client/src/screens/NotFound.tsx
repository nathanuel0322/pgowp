import { Link } from "react-router-dom";
import { PageHero } from "../components/ui";

export default function NotFound() {
    return (
        <>
            <PageHero
                eyebrow="404"
                title={
                    <>
                        Game over. <span className="text-gradient">Page not found.</span>
                    </>
                }
                lede="The page you're looking for doesn't exist or has moved. Hit continue to head back home."
            />
            <div className="wrap flex flex-wrap gap-3">
                <Link to="/" className="btn-gold">
                    Continue
                </Link>
                <Link to="/packages" className="btn-ghost">
                    See packages
                </Link>
            </div>
        </>
    );
}
