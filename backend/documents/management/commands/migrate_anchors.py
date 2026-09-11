import json
import uuid
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from documents.models_versions import CaseDraftVersion

class Command(BaseCommand):
    help = 'Migrates existing CaseDraftVersion snapshots to use stable UUIDs for anchors and structured sourcePageNumber.'

    def handle(self, *args, **options):
        snapshots = CaseDraftVersion.objects.all()
        migrated_count = 0
        
        for version in snapshots:
            snap = version.snapshot_data
            if not isinstance(snap, dict):
                continue
                
            changed = False
            
            # Phase 1: Stable UUIDs
            anchors = snap.get('anchors', [])
            for anchor in anchors:
                old_anchor_id = anchor.get('id', '')
                if ':' in old_anchor_id:
                    doc_id = anchor.get('documentId', 'unknown-doc')
                    new_anchor_id = f"anchor-{doc_id}-{uuid.uuid4()}"
                    
                    # String replace across the entire snapshot json to update all references
                    snap_str = json.dumps(snap)
                    snap_str = snap_str.replace(old_anchor_id, new_anchor_id)
                    snap = json.loads(snap_str)
                    changed = True
            
            # Phase 2: Structured sourcePageNumber
            nodes = snap.get('nodes', [])
            for node in nodes:
                title = node.get('title')
                if title and 'sourcePageNumber' not in node:
                    match = re.search(r'(?i)(page)\s*(\d+)', title)
                    if match:
                        node['sourcePageNumber'] = int(match.group(2))
                        changed = True
                
                # Also check text for picture excerpts
                text = node.get('text')
                if text and 'sourcePageNumber' not in node:
                    match = re.search(r'(?i)(\[Picture Excerpt\s*-\s*Page)\s*(\d+)(\])', text)
                    if match:
                        node['sourcePageNumber'] = int(match.group(2))
                        changed = True

            if changed:
                version.snapshot_data = snap
                with transaction.atomic():
                    version.save(update_fields=['snapshot_data'])
                migrated_count += 1
                
        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {migrated_count} snapshots.'))
