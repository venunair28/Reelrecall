import { createContext, useContext, type ReactNode } from 'react';

export type DragMovieData = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
};

const DragContext = createContext<{
  setDragData: (data: DragMovieData | null) => void;
  getDragData: () => DragMovieData | null;
} | null>(null);

let dragDataStore: DragMovieData | null = null;

export function DragProvider({ children }: { children: ReactNode }) {
  const setDragData = (data: DragMovieData | null) => { dragDataStore = data; };
  const getDragData = () => dragDataStore;
  return (
    <DragContext.Provider value={{ setDragData, getDragData }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDragContext must be used within DragProvider');
  return ctx;
}
