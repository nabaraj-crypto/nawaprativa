(function($) {
    $(document).ready(function() {
        function toggleCustomPosition() {
            var position = $('#id_position').val();
            var customRow = $('#id_custom_position').closest('.form-row, .form-group');
            if (position === 'Other') {
                customRow.show();
            } else {
                customRow.hide();
            }
        }
        toggleCustomPosition();
        $('#id_position').change(toggleCustomPosition);
    });
})(django.jQuery); 