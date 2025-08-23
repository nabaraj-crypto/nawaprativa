(function($) {
    $(document).ready(function() {
        // Function to toggle fields based on media type
        function toggleMediaFields() {
            var mediaType = $('#id_media_type').val();
            
            // Get the field rows
            var imageFieldRow = $('.field-image').closest('.form-row');
            var videoFieldRow = $('.field-video').closest('.form-row');
            
            // Toggle visibility based on media type
            if (mediaType === 'image') {
                imageFieldRow.show();
                videoFieldRow.hide();
                // Clear video field when switching to image
                if (!$('#id_video-clear_id').prop('checked')) {
                    $('#id_video-clear_id').click();
                }
            } else if (mediaType === 'video') {
                imageFieldRow.hide();
                videoFieldRow.show();
                // Clear image field when switching to video
                if (!$('#id_image-clear_id').prop('checked')) {
                    $('#id_image-clear_id').click();
                }
            }
        }
        
        // Initial toggle on page load
        toggleMediaFields();
        
        // Toggle on media type change
        $('#id_media_type').on('change', toggleMediaFields);
        
        // Add help text to media type field
        $('#id_media_type').after('<p class="help">Selecting a media type will show the appropriate upload field below.</p>');
    });
})(django.jQuery);