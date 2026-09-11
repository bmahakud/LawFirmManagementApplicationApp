import re

def update_views_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The existing ink strokes logic ends with:
    #                        if changed:
    #                            ver.snapshot_data = snap
    
    missing_logic = """
                        # Source textboxes
                        for tb in snap.get('sourceTextboxes', []):
                            op = tb.get('pageNumber')
                            if isinstance(op, int):
                                np = remap_page(op)
                                if np != op:
                                    tb['pageNumber'] = np
                                    changed = True

                        # Source bookmarks
                        for bm in snap.get('sourceBookmarks', []):
                            op = bm.get('pageNumber')
                            if isinstance(op, int):
                                np = remap_page(op)
                                if np != op:
                                    bm['pageNumber'] = np
                                    changed = True

                        # Page edits
                        for pe in snap.get('pageEdits', []):
                            op = pe.get('pageNumber')
                            if isinstance(op, int):
                                np = remap_page(op)
                                if np != op:
                                    pe['pageNumber'] = np
                                    changed = True

                        # Viewer state by document
                        v_state_by_doc = snap.get('viewerStateByDocument', {})
                        for doc_key, v_state in v_state_by_doc.items():
                            if isinstance(v_state, dict):
                                old_rotations = v_state.get('pageRotations', {})
                                new_rotations = {}
                                for p_str, rot in old_rotations.items():
                                    try:
                                        p_int = int(p_str)
                                        np = remap_page(p_int)
                                        new_rotations[str(np)] = rot
                                        if np != p_int:
                                            changed = True
                                    except ValueError:
                                        new_rotations[p_str] = rot
                                v_state['pageRotations'] = new_rotations

                                active_p = v_state.get('activePage')
                                if isinstance(active_p, int):
                                    np = remap_page(active_p)
                                    if np != active_p:
                                        v_state['activePage'] = np
                                        changed = True

"""

    replacement_target = """
                        if changed:
                            ver.snapshot_data = snap
"""

    if "# Source textboxes" not in content:
        content = content.replace(replacement_target, missing_logic + replacement_target)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print("Updated views.py successfully")
    else:
        print("views.py already updated")

update_views_file('/Users/diracai/Desktop/Projects DiracAI/AntLegal/LawFirmManagementApplicationApp/backend/documents/views.py')
