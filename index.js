<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MR DOM'S | Dashboard</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --primary: #6c5ce7; --bg: #0f0c29; --card-bg: #1a1a2e; --text: #ffffff; }
        body { font-family: 'Poppins', sans-serif; background: var(--bg); color: var(--text); margin: 0; display: flex; }
        .sidebar { width: 250px; background: var(--card-bg); height: 100vh; padding: 20px; position: fixed; }
        .main-content { margin-left: 280px; padding: 30px; width: 100%; }
        .user-profile { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .avatar { width: 50px; height: 50px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .publish-box { background: var(--card-bg); padding: 20px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #30366d; }
        .publish-box input, .publish-box select, .publish-box textarea { width: 100%; padding: 10px; margin: 10px 0; background: #0f0c29; border: 1px solid #30366d; color: white; border-radius: 8px; }
        .btn-publish { background: var(--primary); color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; }
        .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .card { background: var(--card-bg); padding: 20px; border-radius: 15px; border: 1px solid #30366d; position: relative; }
        .category-tag { background: var(--primary); font-size: 0.8rem; padding: 3px 10px; border-radius: 20px; }
        .price { font-size: 1.5rem; color: #00d2ff; font-weight: bold; margin: 15px 0; }
        .btn-delete { background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; position: absolute; top: 15px; right: 15px; }
    </style>
</head>
<body>

    <nav class="sidebar">
        <h2>MR DOM'S</h2>
        <ul style="list-style: none; padding: 0;">
            <li style="padding: 15px 0;"><a href="/" style="color: white; text-decoration: none;"><i class="fas fa-home"></i> Dashboard</a></li>
            <li style="padding: 15px 0;"><a href="/logout" style="color: #ff4757; text-decoration: none;"><i class="fas fa-sign-out-alt"></i> Déconnexion</a></li>
        </ul>
    </nav>

    <main class="main-content">
        <div class="user-profile">
            <div class="avatar"><%= user.username.substring(0, 2).toUpperCase() %></div>
            <h3>Salut, <%= user.username %> 👋</h3>
        </div>

        <div class="publish-box">
            <h4>Publier un service</h4>
            <form action="/publier-article" method="POST">
                <input type="text" name="title" placeholder="Nom du service (ex: 1000 Abonnés TikTok)" required>
                <select name="category">
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="IPTV">IPTV</option>
                </select>
                <input type="number" name="price" placeholder="Prix (FCFA)" required>
                <textarea name="description" placeholder="Description..."></textarea>
                <button type="submit" class="btn-publish">Mettre en ligne</button>
            </form>
        </div>

        <div class="articles-grid">
            <% if (articles.length > 0) { %>
                <% articles.forEach(article => { %>
                    <div class="card">
                        <span class="category-tag"><%= article.category %></span>
                        <form action="/supprimer-article/<%= article._id %>" method="POST">
                            <button type="submit" class="btn-delete">×</button>
                        </form>
                        <h3><%= article.title %></h3>
                        <p><%= article.description %></p>
                        <div class="price"><%= article.price %> FCFA</div>
                    </div>
                <% }) %>
            <% } else { %>
                <p>Aucun service en ligne.</p>
            <% } %>
        </div>
    </main>

</body>
</html>
