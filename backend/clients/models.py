from django.db import models
import uuid

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='clients', null=True, blank=True)
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='client_profiles/', null=True, blank=True)
    
    # Advocate assignment (required when admin adds a client)
    assigned_advocate = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_clients',
        limit_choices_to={'user_type': 'advocate'}
    )
    
    # Brief summary of the client's legal issue
    brief_summary = models.TextField(blank=True, help_text="Brief summary of the client's legal matter")
    
    # Link to the user account (if client has registered/signed up)
    # Changed from OneToOneField to ForeignKey to allow representation by multiple firms
    user_account = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_profiles'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user_account', 'firm')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
