from django.core.management.base import BaseCommand
from firms.models import Firm, Branch

class Command(BaseCommand):
    help = 'Seed branches for firms'

    def handle(self, *args, **kwargs):
        firms = Firm.objects.all()
        if not firms:
            self.stdout.write(self.style.WARNING('No firms found. Please create a firm first.'))
            return

        for firm in firms:
            # Branch: Joba
            branch_joba, created = Branch.objects.get_or_create(
                firm=firm,
                branch_name='Joba',
                defaults={
                    'city': firm.city,
                    'state': firm.state,
                    'branch_code': f"{firm.firm_code}-JOBA"
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created branch Joba for {firm.firm_name}'))
            
            # Branch: Barbil
            branch_barbil, created = Branch.objects.get_or_create(
                firm=firm,
                branch_name='Barbil',
                defaults={
                    'city': firm.city,
                    'state': firm.state,
                    'branch_code': f"{firm.firm_code}-BARB"
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created branch Barbil for {firm.firm_name}'))
