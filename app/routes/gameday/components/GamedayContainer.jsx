import MobileGamedayContainer from "./MobileGamedayContainer";
import DesktopGamedayContainer from "./DesktopGamedayContainer";

export default function GamedayContainer(props) {
    if (props.isDesktop) {
        return <DesktopGamedayContainer {...props} />;
    }
    return <MobileGamedayContainer {...props} />;
}
