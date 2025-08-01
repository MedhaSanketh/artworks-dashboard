import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputSwitch } from 'primereact/inputswitch';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import type { DataTablePageEvent } from 'primereact/datatable';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

export const ArtworkTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [rowClick, setRowClick] = useState<boolean>(false);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [globalSelectedMap, setGlobalSelectedMap] = useState<Map<number, Artwork>>(new Map());
  const [selectCount, setSelectCount] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);
  const rows = 12;

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  useEffect(() => {
    const currentPageRows = artworks.filter((art) => globalSelectedMap.has(art.id));
    setSelectedArtworks(currentPageRows);
  }, [artworks, globalSelectedMap]);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
      const data = await response.json();
      const artworks: Artwork[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));
      setArtworks(artworks);
      setTotalRecords(data.pagination.total);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: DataTablePageEvent) => {
    const newPage = (event.page ?? 0) + 1;
    setPage(newPage);
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
    const updatedMap = new Map(globalSelectedMap);
    for (const art of e.value) {
      updatedMap.set(art.id, art);
    }
    const currentIds = new Set(e.value.map((a) => a.id));
    for (const art of artworks) {
      if (!currentIds.has(art.id)) {
        updatedMap.delete(art.id);
      }
    }
    setGlobalSelectedMap(updatedMap);
  };

  const selectNRowsAcrossPages = async (n: number) => {
    const selected = new Map(globalSelectedMap);
    let currentPage = 1;

    while (selected.size < n) {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentPage}`);
      const data = await response.json();

      const pageArtworks: Artwork[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      for (const art of pageArtworks) {
        if (selected.size >= n) break;
        if (!selected.has(art.id)) {
          selected.set(art.id, art);
        }
      }

      if (!data.pagination || currentPage >= data.pagination.total_pages) break;
      currentPage++;
    }

    setGlobalSelectedMap(selected);
  };

  const handleCustomSelect = async () => {
    if (selectCount && selectCount > 0) {
      await selectNRowsAcrossPages(selectCount);
      op.current?.hide();
    }
  };

  return (
    <div className="card">
      <h2 className="museum-heading">Art Institute of Chicago - Artworks</h2>

      
      <div className="mb-3 flex align-items-center gap-2">
        <label htmlFor="rowClickSwitch">Row Click Selection:</label>
        <InputSwitch
        id="rowClickSwitch"
        checked={rowClick}
        onChange={(e) => setRowClick(e.value)}
        className="brown-switch"
        />
      </div>


      <div className="flex align-items-center mb-2">
        
        {  (
          <>
            <Button
              icon="pi pi-chevron-down"
              text
              rounded
              aria-label="Custom Select"
              onClick={(e) => op.current?.toggle(e)}
              className="mr-2 light-chevron"
            />
            <OverlayPanel ref={op}>
              <div className="flex flex-column gap-3 p-2">
                <label htmlFor="rowCountInput">Select rows</label>
                <InputNumber
                  inputId="rowCountInput"
                  value={selectCount}
                  onValueChange={(e) => setSelectCount(e.value ?? null)}

                />
                <Button label="Submit" onClick={handleCustomSelect} />
              </div>
            </OverlayPanel>
          </>
        )}
      </div>
      <div className="table-wrapper">
        <DataTable
          className="border border-gray-200 rounded-md"
          value={artworks}
          paginator
          rows={rows}
          first={(page - 1) * rows}
          totalRecords={totalRecords}
          lazy
          loading={loading}
          onPage={onPageChange}
          selectionMode={rowClick ? 'multiple' : 'checkbox'}
          selection={selectedArtworks}
          onSelectionChange={onSelectionChange}
          dataKey="id"
          tableStyle={{ minWidth: '60rem' }}
        >
          {!rowClick && <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />}

          <Column field="title" header="Title" style={{ width: '20%' }} />
          <Column field="place_of_origin" header="Origin" style={{ width: '15%' }} />
          <Column field="artist_display" header="Artist" style={{ width: '25%' }} />
          <Column field="inscriptions" header="Inscriptions" style={{ width: '20%' }} />
          <Column field="date_start" header="Start Year" style={{ width: '10%' }} />
          <Column field="date_end" header="End Year" style={{ width: '10%' }} />
        </DataTable>
      </div>
    </div>
  );
};
