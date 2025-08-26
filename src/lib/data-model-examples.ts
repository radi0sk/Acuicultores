

// NOTA: Este archivo es solo un ejemplo para ilustrar la estructura de datos en Firestore.
// No se utiliza directamente en la aplicación, es un plano de cómo organizaremos la información.

// --- 1. Colección `users` ---
// Almacena el perfil principal y los datos comerciales de cada usuario.
const users = {
  "user_id_123": {
    name: "Carlos Mendoza",
    email: "carlos.mendoza@example.com",
    roles: ["Productor", "Técnico"],
    photoURL: "https://placehold.co/80x80.png",
    location: "Puerto Barrios, Izabal",
    createdAt: "2024-01-15T10:00:00Z",
    // Nuevos campos para seguimiento
    followersCount: 15,
    followingCount: 5,
    followers: ["user_id_456", "..."],
    following: ["user_id_789", "..."]
  },
  "user_id_456": {
    name: "Ana Gómez",
    email: "ana.gomez@example.com",
    roles: ["Productor"],
    photoURL: "https://placehold.co/80x80.png",
    location: "Escuintla, Escuintla",
    createdAt: "2024-02-10T14:30:00Z",
    followersCount: 3,
    followingCount: 8
  }
};


// --- 2. Ejemplo de Publicación de Producto (Colección `products`) ---
// Cada documento es un producto en venta. Registra la actividad del "Marketplace de Insumos".
const products = {
  "product_id_abc": {
    // --- Referencia al vendedor ---
    sellerId: "user_id_456", // <- Enlace al usuario `Ana Gómez`

    // --- Datos duplicados (denormalizados) para evitar consultas extras al listar productos ---
    sellerName: "Ana Gómez",
    sellerPhotoUrl: "https://placehold.co/80x80.png",

    // --- Datos propios del producto ---
    title: "Bomba de Agua Sumergible 1HP",
    price: 1200.00,
    image: "https://placehold.co/600x400.png",
    category: "equipo",
    condition: "usado-bueno",
    description: "Bomba en buen estado, 1 año de uso. Perfecta para estanques medianos.",
    location: "Escuintla, Escuintla",
    tags: ["bomba", "equipo", "agua"],
    status: "active",
    createdAt: "2024-05-20T09:00:00Z",

    // --- Campos para estadísticas de actividad ---
    viewCount: 150,
    saveCount: 12,
    shareCount: 5,
  }
};


// --- 3. Ejemplo de Post en el Foro (Colección `forum_posts`) ---
// Cada documento es una publicación en el foro. Registra la actividad en el "Foro Comunitario".
const forum_posts = {
  "post_id_xyz": {
    // --- Referencia al autor ---
    authorId: "user_id_123", // <- Enlace al usuario `Carlos Mendoza`

    // --- Datos denormalizados del autor para mostrar en la lista del foro ---
    authorName: "Carlos Mendoza",
    authorAvatar: "https://placehold.co/80x80.png",

    // --- Datos propios del post ---
    title: "Observación sobre el pH del agua en la costa sur",
    content: "He notado una ligera acidificación en el agua. Recomiendo mediciones frecuentes...",
    tags: ["Calidad de Agua", "Recomendación"],
    likes: 29,
    createdAt: "2024-05-15T11:45:00Z",

    // Los comentarios serían una sub-colección dentro de este documento para mantenerlos organizados.
    // comments: { "comment_id_1": { userId: "...", text: "...", createdAt: "..." } }
  }
};


// --- 4. Ejemplo de Contribución a la Biblioteca (Colección `library_articles`) ---
// Cada documento es un artículo o guía. Registra la actividad en la "Biblioteca".
const library_articles = {
  "article_id_789": {
    // --- Referencia al contribuidor ---
    contributorId: "user_id_123", // <- Enlace al usuario `Carlos Mendoza`

    // --- Datos denormalizados del contribuidor ---
    contributorName: "Carlos Mendoza",

    // --- Datos propios del artículo ---
    title: "Guía completa para el cultivo de tilapia",
    category: "Producción",
    image: "https://placehold.co/600x400.png",
    content: "Contenido completo de la guía en formato Markdown o HTML...",
    status: "published", // Podría ser 'draft', 'review', 'published'
    createdAt: "2024-04-10T18:00:00Z",

    // --- Campos para estadísticas de actividad ---
    favoriteCount: 55, // Veces que los usuarios lo guardaron como favorito
  }
};


// --- 5. Ejemplo de Publicación en el Centro de Publicaciones (Colección `publications`) ---
const publications = {
    "pub_id_abc": {
        // --- Referencia al autor ---
        authorId: "user_id_123",

        // --- Datos denormalizados del autor ---
        authorName: "Carlos Mendoza",
        authorAvatar: "https://placehold.co/80x80.png",
        
        // --- Datos de la publicación ---
        title: "Resultados de la Cosecha de Primavera 2024",
        content: [
            { type: "text", value: "Nos complace anunciar que la cosecha de primavera ha superado nuestras expectativas. Aquí hay un desglose de los resultados." },
            { type: "image", value: "https://.../image1.jpg" },
            { type: "text", value: "El crecimiento de los alevines fue excepcional gracias al nuevo alimento balanceado." },
            { type: "video", value: "https://.../video1.mp4" }
        ],
        tags: ["Cosecha", "Resultados", "Comunidad"],
        references: "Smith, J. (2023). Avances en la nutrición de tilapia. Journal of Aquaculture.",
        isOpenInvestigation: true,
        
        // --- Campos para estadísticas de actividad ---
        likes: 42,
        likedBy: ["user_id_456", "user_id_789"], // Array de UIDs de usuarios que han dado like
        commentsCount: 18,

        // --- Timestamp ---
        createdAt: "2024-05-22T10:00:00Z",

        // --- Sub-colección de Comentarios ---
        // /publications/pub_id_abc/comments
        comments: {
            "comment_id_1": {
                publicationId: "pub_id_abc",
                authorId: "user_id_456",
                authorName: "Ana Gómez",
                authorAvatar: "https://...",
                text: "¡Felicidades por la excelente cosecha!",
                parentId: null, // Este es un comentario principal
                createdAt: "2024-05-22T11:00:00Z",
            },
            "comment_id_2": {
                publicationId: "pub_id_abc",
                authorId: "user_id_123",
                authorName: "Carlos Mendoza",
                authorAvatar: "https://...",
                text: "¡Gracias, Ana! Fue un gran esfuerzo de equipo.",
                parentId: "comment_id_1", // Es una respuesta al primer comentario
                createdAt: "2024-05-22T11:05:00Z",
            }
        }
    }
}


// --- 6. Ejemplo de Notificación (Colección `notifications`) ---
const notifications = {
    "notif_id_1": {
        userId: "user_id_123", // A quién se le notifica
        type: "new_comment", // Tipo de notificación
        title: "Ana Gómez comentó tu publicación",
        body: "¡Felicidades por la excelente cosecha!", // Snippet del comentario o mensaje
        link: "/publicaciones/pub_id_abc", // Enlace para redirigir al usuario
        isRead: false,
        createdAt: "2024-05-22T11:00:00Z",
        // Quién originó la notificación
        senderId: "user_id_456",
        senderName: "Ana Gómez",
        senderAvatar: "https://..."
    }
}
