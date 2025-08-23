from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_alter_subjectresult_final_grade_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='LeadershipMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('position', models.CharField(max_length=100)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='leadership/')),
                ('message', models.TextField()),
                ('order', models.PositiveIntegerField(default=0, help_text='Order of appearance')),
            ],
            options={
                'ordering': ['order'],
                'verbose_name': 'Leadership Message',
                'verbose_name_plural': 'Leadership Messages',
            },
        ),
    ] 