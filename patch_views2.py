import os

filepath = '/Users/diracai/Desktop/Projects DiracAI/AntLegal/LawFirmManagementApplicationApp/backend/documents/views.py'
with open(filepath, 'r') as f:
    content = f.read()

import re

# Find the start of reorder_filing_pack
def_match = re.search(r"def reorder_filing_pack\(self, request\):", content)
if not def_match:
    print("reorder_filing_pack not found")
    exit(1)

start_idx = def_match.start()

# We need to wrap the whole body in a transaction, except the first few lines?
# Actually, the easiest is to just use a standard search and replace for the logic from `old_manifest = []` down to the return.

replacement = """def reorder_filing_pack(self, request):
        \"\"\"
        Saves custom display sequence for all items in the filing pack and recompiles the Master PDF.
        \"\"\"
        case_id = request.data.get('case_id')
        ordered_items = request.data.get('ordered_items', [])
        if not case_id:
            return Response({"detail": "case_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        from .models_templates import FilledCourtForm
        from django.db import transaction

        try:
            with transaction.atomic():
                from cases.models import Case
                # Phase 5: Transactionality & concurrent-reorder protection
                _ = Case.objects.select_for_update().get(id=case_id)

                for seq, item in enumerate(ordered_items, 1):
                    item_id = item.get('id') if isinstance(item, dict) else item
                    item_type = item.get('type') if isinstance(item, dict) else None
                    if not item_id:
                        continue

                    try:
                        target_seq = int(item.get('sequence', seq) if isinstance(item, dict) else seq)
                    except (ValueError, TypeError):
                        target_seq = seq

                    if item_type == 'court_form':
                        FilledCourtForm.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)
                    elif item_type == 'document':
                        UserDocument.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)
                    else:
                        c_cnt = FilledCourtForm.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)
                        if not c_cnt:
                            UserDocument.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)

                # Capture old manifest before recompilation
                old_master = UserDocument.objects.filter(
                    case_id=case_id,
                    is_deleted=False,
                    document_title__icontains="Master Case Filing Pack"
                ).order_by('-updated_at').first()
                
                old_manifest = []
                if old_master and old_master.verification_notes:
                    try:
                        import json
                        parsed = json.loads(old_master.verification_notes)
                        if isinstance(parsed, list):
                            old_manifest = parsed
                        elif isinstance(parsed, dict):
                            old_manifest = parsed.get('manifest_json', parsed.get('manifest', []))
                    except Exception:
                        old_manifest = []

                # Trigger immediate recompilation with updated order
                from .services.pdf_merger import generate_merged_case_filing_pdf
                master_doc = generate_merged_case_filing_pdf(case_id, user=request.user)

                new_manifest = []
                if master_doc and master_doc.verification_notes:
                    try:
                        import json
                        parsed = json.loads(master_doc.verification_notes)
                        if isinstance(parsed, list):
                            new_manifest = parsed
                        elif isinstance(parsed, dict):
                            new_manifest = parsed.get('manifest_json', parsed.get('manifest', []))
                    except Exception:
                        new_manifest = []

                # Phase 3: Single source of truth for the offset mapping
                page_mapping = {}
                if old_manifest and new_manifest:
                    for doc in old_manifest:
                        start = doc.get('start_page', 1)
                        end = doc.get('end_page', 1)
                        doc_id = str(doc.get('id', ''))
                        doc_title = doc.get('title', '').strip().lower()
                        new_doc = next((nd for nd in new_manifest if (nd.get('id') and str(nd.get('id')) == doc_id) or (nd.get('title') and nd.get('title').strip().lower() == doc_title)), None)
                        
                        for op in range(start, end + 1):
                            if new_doc:
                                offset = op - start
                                safe_offset = min(offset, max(0, new_doc.get('page_count', 1) - 1))
                                page_mapping[str(op)] = new_doc.get('start_page', 1) + safe_offset
                            else:
                                page_mapping[str(op)] = None

                    try:
                        from .models_versions import CaseDraftVersion
                        
                        def apply_mapping(field):
                            if isinstance(field, int):
                                new_p = page_mapping.get(str(field))
                                return new_p if new_p is not None else field
                            return field

                        doc_ident = f"doc-master-{case_id}"
                        # Phase 4: Migrate all snapshots
                        all_versions = CaseDraftVersion.objects.filter(case_id=case_id, document_identifier=doc_ident).all()
                        for ver in all_versions:
                            snap = ver.snapshot_data or {}
                            changed = False

                            for a in snap.get('anchors', []):
                                op = a.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    a['pageNumber'] = np
                                    changed = True

                            for exc in snap.get('excerpts', []):
                                op = exc.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    exc['pageNumber'] = np
                                    changed = True

                            for n in snap.get('nodes', []):
                                op = n.get('sourcePageNumber')
                                if op is not None:
                                    np = apply_mapping(op)
                                    if np != op:
                                        n['sourcePageNumber'] = np
                                        changed = True

                            for hl in snap.get('freeformHighlights', []):
                                op = hl.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    hl['pageNumber'] = np
                                    changed = True

                            for st in snap.get('inkStrokes', []):
                                op = st.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    st['pageNumber'] = np
                                    changed = True

                            for tb in snap.get('sourceTextboxes', []):
                                op = tb.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    tb['pageNumber'] = np
                                    changed = True

                            for bm in snap.get('sourceBookmarks', []):
                                op = bm.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    bm['pageNumber'] = np
                                    changed = True

                            for pe in snap.get('pageEdits', []):
                                op = pe.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    pe['pageNumber'] = np
                                    changed = True

                            v_state_by_doc = snap.get('viewerStateByDocument', {})
                            for doc_key, v_state in v_state_by_doc.items():
                                if isinstance(v_state, dict):
                                    old_rotations = v_state.get('pageRotations', {})
                                    new_rotations = {}
                                    for p_str, rot in old_rotations.items():
                                        try:
                                            p_int = int(p_str)
                                            np = apply_mapping(p_int)
                                            new_rotations[str(np)] = rot
                                            if np != p_int:
                                                changed = True
                                        except ValueError:
                                            new_rotations[p_str] = rot
                                    v_state['pageRotations'] = new_rotations

                                    active_p = v_state.get('activePage')
                                    np = apply_mapping(active_p)
                                    if np != active_p:
                                        v_state['activePage'] = np
                                        changed = True

                            if changed:
                                ver.snapshot_data = snap
                                ver.save(update_fields=['snapshot_data'])
                    except Exception as snap_err:
                        print(f"Non-fatal error remapping snapshot versions: {snap_err}")

                from .serializers import UserDocumentSerializer
                serializer = UserDocumentSerializer(master_doc, context={'request': request})
                return Response({
                    "detail": "Filing pack reordered and recompiled successfully.",
                    "master_document": serializer.data,
                    "old_manifest": old_manifest,
                    "new_manifest": new_manifest,
                    "page_mapping": page_mapping,
                    "updated_at": master_doc.updated_at.isoformat() if master_doc.updated_at else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error recompiling merged PDF after reorder: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                "detail": f"Order saved, but PDF recompilation had an issue: {str(e)}"
            }, status=status.HTTP_200_OK)
"""

# Replace from `def reorder_filing_pack(self, request):` to the end of that method.
end_match = re.search(r"def filing_pack_manifest\(self, request\):", content)
if not end_match:
    print("filing_pack_manifest not found")
    exit(1)

end_idx = end_match.start()
new_content = content[:start_idx] + replacement + "\n    @action(detail=False, methods=['get'], url_path='filing-pack-manifest', permission_classes=[permissions.AllowAny])\n    " + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(new_content)

print("Patched views.py successfully")
