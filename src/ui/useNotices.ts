import { useCallback, useState } from "react";
import { NoticeQueue } from "../domain/notices";

const NOTICE_MS = 10000;

/** The notice to show now, from the queue, and how to add one (a stable function). */
export function useNotices(): { notice: string | null; addNotice: (notice: string) => void } {
  const [, setVersion] = useState(0);
  const [queue] = useState(() => new NoticeQueue(NOTICE_MS, () => setVersion((v) => v + 1)));
  const addNotice = useCallback((notice: string) => queue.add(notice), [queue]);
  return { notice: queue.current, addNotice };
}
