import HeroBanner from "./HeroBanner";
import FeaturedSongs from "./FeaturedSongs";
import FeaturedAlbums from "./FeaturedAlbums";
import DailyMix from "./DailyMix";

export default function HomePage() {
    return (
        <div>
            <HeroBanner/>
            <FeaturedSongs/>
            <DailyMix/>
            <FeaturedAlbums/>
        </div>
    );
}
