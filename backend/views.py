from django.shortcuts import render

def notes_view(request):
    """
    View for displaying notes, question papers and PDFs
    """
    return render(request, 'notes.html')