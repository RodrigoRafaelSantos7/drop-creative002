import { HistoryPill } from "./history";
import { ZoomBar } from "./zoom";

const Toolbar = () => (
  <div className="fixed bottom-0 z-50 grid w-full grid-cols-3 p-5">
    <HistoryPill />
    <ZoomBar />
  </div>
);

export { Toolbar };
