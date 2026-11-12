#!/usr/bin/env python3
from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Link
from pypdf.generic import DictionaryObject, NameObject

src = "/home/visa/Project/personal/dd-player/docs/PRESENTATION.pdf"
reader = PdfReader(src)
writer = PdfWriter()
writer.append(reader)

writer.page_layout = "/SinglePage"
writer.page_mode = "/FullScreen"

root = writer._root_object
prefs = DictionaryObject()
prefs[NameObject("/DisplayDocTitle")] = NameObject("/true")
prefs[NameObject("/FitWindow")] = NameObject("/true")
prefs[NameObject("/NonFullScreenPageMode")] = NameObject("/UseOutlines")
root[NameObject("/ViewerPreferences")] = prefs
root[NameObject("/PageMode")] = NameObject("/FullScreen")
root[NameObject("/PageLayout")] = NameObject("/SinglePage")

writer.add_outline_item("Introduzione", 0)
writer.add_outline_item("Nome", 1)
rf = writer.add_outline_item("Requisiti funzionali", 2)
writer.add_outline_item("Piattaforme target", 3, parent=rf)
writer.add_outline_item("Online e offline", 4, parent=rf)
writer.add_outline_item("Flussi video", 5, parent=rf)
writer.add_outline_item("Colore e audio", 6, parent=rf)
writer.add_outline_item("Struttura modulare", 7, parent=rf)
writer.add_outline_item("Sistemi esterni", 8, parent=rf)
writer.add_outline_item("Schema strutturale", 9, parent=rf)

core = writer.add_outline_item("Core", 10)
writer.add_outline_item("Host", 10, parent=core)
writer.add_outline_item("System / suddivisione", 11, parent=core)
writer.add_outline_item("Device annidati", 12, parent=core)
writer.add_outline_item("Auth", 13, parent=core)
writer.add_outline_item("Playlist / standalone", 14, parent=core)
writer.add_outline_item("External flows", 15, parent=core)
writer.add_outline_item("Settings", 16, parent=core)
writer.add_outline_item("Comunicazione", 17, parent=core)

extra = writer.add_outline_item("Extra", 18)
writer.add_outline_item("Soccer", 18, parent=extra)
writer.add_outline_item("Volley", 19, parent=extra)
writer.add_outline_item("Basket", 20, parent=extra)
writer.add_outline_item("Palinsesto", 21, parent=extra)
writer.add_outline_item("Nova", 22, parent=extra)
writer.add_outline_item("Stream Deck", 23, parent=extra)
writer.add_outline_item("Bertelè", 24, parent=extra)

op = writer.add_outline_item("Requisiti operativi", 25)
writer.add_outline_item("Gantt", 26, parent=op)


def add_index_links(page_index, dests, top=402, row_h=36, left=90, right=870):
    for i, dest in enumerate(dests):
        y1 = top - i * row_h
        y0 = y1 - row_h + 4
        writer.add_annotation(
            page_number=page_index,
            annotation=Link(
                rect=(left, y0, right, y1),
                target_page_index=dest,
                border=[0, 0, 0],
            ),
        )


add_index_links(2, [3, 4, 5, 6, 7, 8, 9], row_h=32)
add_index_links(25, [26, 26, 26, 26], top=390, row_h=40)

# Pagina 8 (struttura): due colonne Core / Extra
core_dests = [10, 11, 13, 14, 15, 16, 17]
extra_dests = [18, 19, 20, 21, 22, 23, 24]
add_index_links(7, core_dests, top=318, row_h=28, left=88, right=520)
add_index_links(7, extra_dests, top=318, row_h=28, left=548, right=880)

# Pulsanti precedente / successiva su ogni pagina
# Pagina 10 (schema) ⇄ 26 (requisiti operativi)
# Pagina 25 (ultimo Extra) ← 8 (struttura Core / Extra), → 9 (sistemi esterni)
next_overrides = {9: 25, 24: 8}
prev_overrides = {25: 9, 24: 7}
prev_rect = (61, 20, 92, 51)
next_rect = (868, 20, 899, 51)
for i in range(len(writer.pages)):
    prev = prev_overrides.get(i)
    if prev is None and i > 0:
        prev = i - 1
    if prev is not None:
        writer.add_annotation(
            page_number=i,
            annotation=Link(rect=prev_rect, target_page_index=prev, border=[0, 0, 0]),
        )
    dest = next_overrides.get(i)
    if dest is None and i < len(writer.pages) - 1:
        dest = i + 1
    if dest is not None:
        writer.add_annotation(
            page_number=i,
            annotation=Link(rect=next_rect, target_page_index=dest, border=[0, 0, 0]),
        )

with open(src, "wb") as f:
    writer.write(f)
print("navigable", len(writer.pages), "pages")
