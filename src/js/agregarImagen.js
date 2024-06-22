import { Dropzone } from 'dropzone'

const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

Dropzone.options.imagen = {
    dictDefaultMessage: 'Arrastra tus imágenes aquí',
    acceptedFiles: '.png,.jpg,.jpeg',
    maxFilesSize: 5,
    maxFiles: 1,
    parallelUploads: 1,
    autoProcessQueue: false, // En true lo intenta subir en automático
    addRemoveLinks: true,
    dictRemoveFile: "Eliminar archivo",
    dictMaxFilesExceeded: 'El límite es 1 archivo',
    headers: {
        'CSRF-Token': token
    },
    paramName: 'imagen',
    init: function() { // Permite escribir sobre el objeto de dropzone
        const dropzone = this
        const btnPublicar = document.querySelector('#publicar')

        btnPublicar.addEventListener('click', function() {
            dropzone.processQueue()
        })

        dropzone.on('queuecomplete', function() {
            if(dropzone.getActiveFiles().length == 0){
                window.location.href = '/mis-propiedades'
            }
        })
    }
}

    // dictDefaultMessage: "Arrastra los archivos aquí para subir",
    // dictFallbackMessage: "Su navegador no soporta la carga de archivos mediante arrastrar y soltar.",
    // dictFallbackText: "Por favor, use el formulario de respaldo a continuación para cargar sus archivos como en los viejos tiempos.",
    // dictFileTooBig: "El archivo es demasiado grande ({{filesize}}MiB). Tamaño máximo: {{maxFilesize}}MiB.",
    // dictInvalidFileType: "No puedes subir archivos de este tipo.",
    // dictResponseError: "El servidor respondió con el código {{statusCode}}.",
    // dictCancelUpload: "Cancelar subida",
    // dictCancelUploadConfirmation: "¿Estás seguro de que deseas cancelar esta subida?",
    // dictRemoveFile: "Eliminar archivo",
    // dictRemoveFileConfirmation: null,
    // dictMaxFilesExceeded: "No puedes subir más archivos."