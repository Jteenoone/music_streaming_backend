import HeroBanner from "./HeroBanner";
import FeaturedSongs from "./FeaturedSongs";
import FeaturedAlbums from "./FeaturedAlbums";

export default function HomePage() {
    return (
        <div>
            <HeroBanner/>
            <FeaturedSongs/>
            <FeaturedAlbums/>
        </div>
    );
}
