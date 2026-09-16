'use strict';

/*
 * Trevi — gestor de listas de desejos para o Obsidian.
 * "Joga uma moeda na fonte e faz um pedido."
 * Mobile-safe: sem módulos do Node, toda a rede via requestUrl, imagens em pasta plana por UUID.
 * Build 0.2.0 — dados em core/, clicar-para-abrir, presets de paleta, estatísticas por etiqueta e tendência, i18n pt/en/es/de/fr/it.
 */

const obsidian = require('obsidian');
const { Plugin, ItemView, Modal, Setting, PluginSettingTab, Notice, Menu, requestUrl, normalizePath, addIcon, setIcon } = obsidian;

/* ============================ Constantes ============================ */
const VIEW_TYPE = 'trevi-view';
const DATA_VERSION = 1;

const PRIORITIES = ['alta', 'media', 'baixa'];
const STATUSES = ['desejado', 'comprado', 'arquivado'];
const CURRENCIES = ['EUR', 'BRL', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

// Presets de paleta — cor só nos dados (fundo/eixos herdam o tema).
const PALETTES = {
	trevi: { agua: '#4F9D94', latao: '#BFA25A', terracota: '#C06B4E', noite: '#4A6B82', louro: '#8FA27E', marmore: '#9B8AA0' },
	travertino: { agua: '#C2A166', latao: '#B0863F', terracota: '#B4633B', noite: '#8C7B58', louro: '#A79268', marmore: '#B9A98C' },
	acquamarina: { agua: '#3FB0A6', latao: '#6FB8C6', terracota: '#5A9BC0', noite: '#3E6E8C', louro: '#6FA89E', marmore: '#8FB2AE' },
	notturno: { agua: '#6FC3B8', latao: '#CBB57C', terracota: '#D08668', noite: '#7590AC', louro: '#A3B892', marmore: '#B4A4BA' },
};
const PALETTE = PALETTES.trevi;
const PALETTE_LABELS = { agua: 'Água', latao: 'Latão', terracota: 'Terracota', noite: 'Noite', louro: 'Louro', marmore: 'Mármore' };
const STATUS_PAL = { desejado: 'agua', comprado: 'latao', arquivado: 'marmore' };
const PRIORITY_PAL = { alta: 'terracota', media: 'latao', baixa: 'noite' };
const CYCLE = ['agua', 'latao', 'terracota', 'noite', 'louro', 'marmore'];

// Bootstrap (loadData/saveData): só os CAMINHOS. A fonte de verdade é o JSON no cofre.
const BOOTSTRAP_DEFAULTS = { dataFile: 'core/trevi/trevi.json', imagesFolder: 'core/trevi/assets' };

const DEFAULT_SETTINGS = {
	defaultCurrency: 'EUR',
	language: 'pt',
	trashRetentionDays: 14,
	seedInitialHistory: true,
	palette: 'trevi',
	paletteOverrides: {},
};

const FOUNTAIN_ICON = `<circle cx="50" cy="26" r="9" fill="none" stroke="currentColor" stroke-width="6"/><path fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" d="M22 52 Q50 40 78 52 M28 52 L34 82 M72 52 L66 82 M34 82 Q50 90 66 82"/>`;

/* ============================ i18n ============================ */
const I18N = {
	pt: {
		piazza: 'Piazza', open_piazza: 'Abrir Piazza', new_list: 'Nova lista',
		add_item: 'Lançar uma moeda', add_by_url: 'Adicionar por URL', add_manual: 'Adicionar manualmente',
		update_all_prices: 'Atualizar todos os preços', update_this_price: 'Atualizar este preço',
		open_stats: 'Estatísticas', settings: 'Definições',
		lists: 'listas', items: 'itens', item: 'item', total: 'total', empty_piazza: 'Sem listas. Cria a primeira e faz o teu primeiro pedido.',
		empty_list: 'Lista vazia. Lança uma moeda para adicionar um desejo.', back: 'Voltar', edit: 'Editar', 'delete': 'Excluir', restore: 'Restaurar',
		confirm_delete_list: 'Excluir a lista "{name}" e os seus itens? Vão para a lixeira.',
		confirm_delete_item: 'Excluir "{title}"? Vai para a lixeira.',
		trash: 'Lixeira', empty_trash: 'Esvaziar lixeira', purge_now: 'Purgar definitivamente', trash_empty: 'Lixeira vazia.',
		search: 'Procurar…', filter: 'Filtro', sort: 'Ordenar', all: 'Todos',
		sort_price: 'Preço', sort_priority: 'Prioridade', sort_date: 'Data', sort_title: 'Título',
		title: 'Título', url: 'Link (URL)', price: 'Preço', currency: 'Moeda', image: 'Imagem',
		priority: 'Prioridade', status: 'Estado', tags: 'Etiquetas', notes: 'Notas',
		alta: 'Alta', media: 'Média', baixa: 'Baixa', desejado: 'Desejado', comprado: 'Comprado', arquivado: 'Arquivado',
		fetch_meta: 'Buscar dados do link', fetch_short: 'Buscar', choose_image: 'Escolher imagem', replace_image: 'Substituir imagem', remove_image: 'Remover imagem',
		list_name: 'Nome da lista', save: 'Guardar', cancel: 'Cancelar', create: 'Criar', rename: 'Renomear',
		set_cover: 'Definir capa', new_item_title: 'Novo item', edit_item_title: 'Editar item',
		stats_total: 'Valor total', stats_by_status: 'Por estado', stats_by_priority: 'Por prioridade', stats_by_tag: 'Por etiqueta', stats_price_trend: 'Tendência de preço',
		fetching: 'A buscar metadados…', fetch_ok: 'Dados preenchidos a partir do link.', fetch_partial: 'Alguns dados não foram encontrados — preenche manualmente.', fetch_fail: 'Não foi possível ler o link. Preenche manualmente.',
		price_updated: '{n} preço(s) atualizado(s).', price_none: 'Sem itens com link para atualizar.', no_price_change: 'Sem alterações de preço.',
		invalid_currency: 'Código de moeda inválido (usa ISO 4217, ex.: EUR).', title_required: 'O título é obrigatório.',
		image_saved: 'Imagem guardada.', image_fail: 'Falha ao obter a imagem.', gc_done: '{n} imagem(ns) órfã(s) removida(s).', gc_none: 'Sem imagens órfãs.',
		clean_orphans: 'Limpar imagens órfãs', deleted_at: 'excluído', in_list: 'em',
		cover_set: 'Capa definida.', palette: 'Paleta de gráficos', palette_reset: 'Repor cores da paleta', price_trend_none: 'Sem histórico de preços ainda.',
	},
	en: {
		piazza: 'Piazza', open_piazza: 'Open Piazza', new_list: 'New list',
		add_item: 'Toss a coin', add_by_url: 'Add by URL', add_manual: 'Add manually',
		update_all_prices: 'Update all prices', update_this_price: 'Update this price',
		open_stats: 'Statistics', settings: 'Settings',
		lists: 'lists', items: 'items', item: 'item', total: 'total', empty_piazza: 'No lists yet. Create your first and make a wish.',
		empty_list: 'Empty list. Toss a coin to add a wish.', back: 'Back', edit: 'Edit', 'delete': 'Delete', restore: 'Restore',
		confirm_delete_list: 'Delete list "{name}" and its items? They go to the trash.',
		confirm_delete_item: 'Delete "{title}"? It goes to the trash.',
		trash: 'Trash', empty_trash: 'Empty trash', purge_now: 'Purge permanently', trash_empty: 'Trash is empty.',
		search: 'Search…', filter: 'Filter', sort: 'Sort', all: 'All',
		sort_price: 'Price', sort_priority: 'Priority', sort_date: 'Date', sort_title: 'Title',
		title: 'Title', url: 'Link (URL)', price: 'Price', currency: 'Currency', image: 'Image',
		priority: 'Priority', status: 'Status', tags: 'Tags', notes: 'Notes',
		alta: 'High', media: 'Medium', baixa: 'Low', desejado: 'Wished', comprado: 'Bought', arquivado: 'Archived',
		fetch_meta: 'Fetch link data', fetch_short: 'Fetch', choose_image: 'Choose image', replace_image: 'Replace image', remove_image: 'Remove image',
		list_name: 'List name', save: 'Save', cancel: 'Cancel', create: 'Create', rename: 'Rename',
		set_cover: 'Set as cover', new_item_title: 'New item', edit_item_title: 'Edit item',
		stats_total: 'Total value', stats_by_status: 'By status', stats_by_priority: 'By priority', stats_by_tag: 'By tag', stats_price_trend: 'Price trend',
		fetching: 'Fetching metadata…', fetch_ok: 'Filled from the link.', fetch_partial: 'Some data missing — fill in manually.', fetch_fail: 'Could not read the link. Fill in manually.',
		price_updated: '{n} price(s) updated.', price_none: 'No items with a link to update.', no_price_change: 'No price changes.',
		invalid_currency: 'Invalid currency code (use ISO 4217, e.g. EUR).', title_required: 'Title is required.',
		image_saved: 'Image saved.', image_fail: 'Failed to fetch image.', gc_done: '{n} orphan image(s) removed.', gc_none: 'No orphan images.',
		clean_orphans: 'Clean orphan images', deleted_at: 'deleted', in_list: 'in',
		cover_set: 'Cover set.', palette: 'Chart palette', palette_reset: 'Reset palette colors', price_trend_none: 'No price history yet.',
	},
	es: {"piazza": "Piazza", "open_piazza": "Abrir Piazza", "new_list": "Nueva lista", "add_item": "Lanza una moneda", "add_by_url": "Añadir por URL", "add_manual": "Añadir manualmente", "update_all_prices": "Actualizar todos los precios", "update_this_price": "Actualizar este precio", "open_stats": "Estadísticas", "settings": "Ajustes", "lists": "listas", "items": "artículos", "item": "artículo", "total": "total", "empty_piazza": "Sin listas. Crea la primera y pide tu primer deseo.", "empty_list": "Lista vacía. Lanza una moneda para añadir un deseo.", "back": "Volver", "edit": "Editar", "delete": "Eliminar", "restore": "Restaurar", "confirm_delete_list": "¿Eliminar la lista «{name}» y sus artículos? Irán a la papelera.", "confirm_delete_item": "¿Eliminar «{title}»? Irá a la papelera.", "trash": "Papelera", "empty_trash": "Vaciar papelera", "purge_now": "Purgar definitivamente", "trash_empty": "Papelera vacía.", "search": "Buscar…", "filter": "Filtro", "sort": "Ordenar", "all": "Todos", "sort_price": "Precio", "sort_priority": "Prioridad", "sort_date": "Fecha", "sort_title": "Título", "title": "Título", "url": "Enlace (URL)", "price": "Precio", "currency": "Moneda", "image": "Imagen", "priority": "Prioridad", "status": "Estado", "tags": "Etiquetas", "notes": "Notas", "alta": "Alta", "media": "Media", "baixa": "Baja", "desejado": "Deseado", "comprado": "Comprado", "arquivado": "Archivado", "fetch_meta": "Obtener datos del enlace", "fetch_short": "Obtener", "choose_image": "Elegir imagen", "replace_image": "Sustituir imagen", "remove_image": "Quitar imagen", "list_name": "Nombre de la lista", "save": "Guardar", "cancel": "Cancelar", "create": "Crear", "rename": "Renombrar", "set_cover": "Establecer portada", "new_item_title": "Nuevo artículo", "edit_item_title": "Editar artículo", "stats_total": "Valor total", "stats_by_status": "Por estado", "stats_by_priority": "Por prioridad", "stats_by_tag": "Por etiqueta", "stats_price_trend": "Tendencia de precio", "fetching": "Obteniendo metadatos…", "fetch_ok": "Datos rellenados a partir del enlace.", "fetch_partial": "Algunos datos no se encontraron — rellénalos manualmente.", "fetch_fail": "No se pudo leer el enlace. Rellénalo manualmente.", "price_updated": "{n} precio(s) actualizado(s).", "price_none": "No hay artículos con enlace para actualizar.", "no_price_change": "Sin cambios de precio.", "invalid_currency": "Código de moneda no válido (usa ISO 4217, p. ej.: EUR).", "title_required": "El título es obligatorio.", "image_saved": "Imagen guardada.", "image_fail": "Error al obtener la imagen.", "gc_done": "{n} imagen(es) huérfana(s) eliminada(s).", "gc_none": "No hay imágenes huérfanas.", "clean_orphans": "Limpiar imágenes huérfanas", "deleted_at": "eliminado", "in_list": "en", "cover_set": "Portada establecida.", "palette": "Paleta de gráficos", "palette_reset": "Restablecer colores de la paleta", "price_trend_none": "Aún no hay historial de precios."},
	de: {"piazza": "Piazza", "open_piazza": "Piazza öffnen", "new_list": "Neue Liste", "add_item": "Eine Münze werfen", "add_by_url": "Per URL hinzufügen", "add_manual": "Manuell hinzufügen", "update_all_prices": "Alle Preise aktualisieren", "update_this_price": "Diesen Preis aktualisieren", "open_stats": "Statistiken", "settings": "Einstellungen", "lists": "Listen", "items": "Artikel", "item": "Artikel", "total": "Gesamt", "empty_piazza": "Keine Listen. Erstelle die erste und äußere deinen ersten Wunsch.", "empty_list": "Leere Liste. Wirf eine Münze, um einen Wunsch hinzuzufügen.", "back": "Zurück", "edit": "Bearbeiten", "delete": "Löschen", "restore": "Wiederherstellen", "confirm_delete_list": "Liste „{name}“ und ihre Artikel löschen? Sie wandern in den Papierkorb.", "confirm_delete_item": "„{title}“ löschen? Wandert in den Papierkorb.", "trash": "Papierkorb", "empty_trash": "Papierkorb leeren", "purge_now": "Endgültig löschen", "trash_empty": "Papierkorb ist leer.", "search": "Suchen…", "filter": "Filter", "sort": "Sortieren", "all": "Alle", "sort_price": "Preis", "sort_priority": "Priorität", "sort_date": "Datum", "sort_title": "Titel", "title": "Titel", "url": "Link (URL)", "price": "Preis", "currency": "Währung", "image": "Bild", "priority": "Priorität", "status": "Status", "tags": "Tags", "notes": "Notizen", "alta": "Hoch", "media": "Mittel", "baixa": "Niedrig", "desejado": "Gewünscht", "comprado": "Gekauft", "arquivado": "Archiviert", "fetch_meta": "Daten vom Link abrufen", "fetch_short": "Abrufen", "choose_image": "Bild auswählen", "replace_image": "Bild ersetzen", "remove_image": "Bild entfernen", "list_name": "Listenname", "save": "Speichern", "cancel": "Abbrechen", "create": "Erstellen", "rename": "Umbenennen", "set_cover": "Titelbild festlegen", "new_item_title": "Neuer Artikel", "edit_item_title": "Artikel bearbeiten", "stats_total": "Gesamtwert", "stats_by_status": "Nach Status", "stats_by_priority": "Nach Priorität", "stats_by_tag": "Nach Tag", "stats_price_trend": "Preisentwicklung", "fetching": "Metadaten werden abgerufen…", "fetch_ok": "Daten aus dem Link übernommen.", "fetch_partial": "Einige Daten wurden nicht gefunden – bitte manuell ergänzen.", "fetch_fail": "Der Link konnte nicht gelesen werden. Bitte manuell ausfüllen.", "price_updated": "{n} Preis(e) aktualisiert.", "price_none": "Keine Artikel mit Link zum Aktualisieren.", "no_price_change": "Keine Preisänderungen.", "invalid_currency": "Ungültiger Währungscode (verwende ISO 4217, z. B. EUR).", "title_required": "Der Titel ist erforderlich.", "image_saved": "Bild gespeichert.", "image_fail": "Bild konnte nicht abgerufen werden.", "gc_done": "{n} verwaiste(s) Bild(er) entfernt.", "gc_none": "Keine verwaisten Bilder.", "clean_orphans": "Verwaiste Bilder bereinigen", "deleted_at": "gelöscht", "in_list": "in", "cover_set": "Titelbild festgelegt.", "palette": "Diagrammpalette", "palette_reset": "Palettenfarben zurücksetzen", "price_trend_none": "Noch kein Preisverlauf vorhanden."},
	fr: {"piazza": "Piazza", "open_piazza": "Ouvrir la Piazza", "new_list": "Nouvelle liste", "add_item": "Lancer une pièce", "add_by_url": "Ajouter par URL", "add_manual": "Ajouter manuellement", "update_all_prices": "Actualiser tous les prix", "update_this_price": "Actualiser ce prix", "open_stats": "Statistiques", "settings": "Paramètres", "lists": "listes", "items": "articles", "item": "article", "total": "total", "empty_piazza": "Aucune liste. Créez la première et faites votre premier vœu.", "empty_list": "Liste vide. Lancez une pièce pour ajouter un souhait.", "back": "Retour", "edit": "Modifier", "delete": "Supprimer", "restore": "Restaurer", "confirm_delete_list": "Supprimer la liste « {name} » et ses articles ? Ils iront à la corbeille.", "confirm_delete_item": "Supprimer « {title} » ? Il ira à la corbeille.", "trash": "Corbeille", "empty_trash": "Vider la corbeille", "purge_now": "Purger définitivement", "trash_empty": "Corbeille vide.", "search": "Rechercher…", "filter": "Filtre", "sort": "Trier", "all": "Tous", "sort_price": "Prix", "sort_priority": "Priorité", "sort_date": "Date", "sort_title": "Titre", "title": "Titre", "url": "Lien (URL)", "price": "Prix", "currency": "Devise", "image": "Image", "priority": "Priorité", "status": "Statut", "tags": "Étiquettes", "notes": "Notes", "alta": "Haute", "media": "Moyenne", "baixa": "Basse", "desejado": "Souhaité", "comprado": "Acheté", "arquivado": "Archivé", "fetch_meta": "Récupérer les données du lien", "fetch_short": "Récupérer", "choose_image": "Choisir une image", "replace_image": "Remplacer l'image", "remove_image": "Retirer l'image", "list_name": "Nom de la liste", "save": "Enregistrer", "cancel": "Annuler", "create": "Créer", "rename": "Renommer", "set_cover": "Définir la couverture", "new_item_title": "Nouvel article", "edit_item_title": "Modifier l'article", "stats_total": "Valeur totale", "stats_by_status": "Par statut", "stats_by_priority": "Par priorité", "stats_by_tag": "Par étiquette", "stats_price_trend": "Tendance des prix", "fetching": "Récupération des métadonnées…", "fetch_ok": "Données remplies à partir du lien.", "fetch_partial": "Certaines données sont introuvables — remplissez manuellement.", "fetch_fail": "Impossible de lire le lien. Remplissez manuellement.", "price_updated": "{n} prix actualisé(s).", "price_none": "Aucun article avec lien à actualiser.", "no_price_change": "Aucun changement de prix.", "invalid_currency": "Code de devise invalide (utilisez ISO 4217, ex. : EUR).", "title_required": "Le titre est obligatoire.", "image_saved": "Image enregistrée.", "image_fail": "Échec de récupération de l'image.", "gc_done": "{n} image(s) orpheline(s) supprimée(s).", "gc_none": "Aucune image orpheline.", "clean_orphans": "Nettoyer les images orphelines", "deleted_at": "supprimé", "in_list": "dans", "cover_set": "Couverture définie.", "palette": "Palette des graphiques", "palette_reset": "Réinitialiser les couleurs de la palette", "price_trend_none": "Aucun historique de prix pour le moment."},
	it: {"piazza": "Piazza", "open_piazza": "Apri Piazza", "new_list": "Nuova lista", "add_item": "Lancia una moneta", "add_by_url": "Aggiungi da URL", "add_manual": "Aggiungi manualmente", "update_all_prices": "Aggiorna tutti i prezzi", "update_this_price": "Aggiorna questo prezzo", "open_stats": "Statistiche", "settings": "Impostazioni", "lists": "liste", "items": "elementi", "item": "elemento", "total": "totale", "empty_piazza": "Nessuna lista. Crea la prima ed esprimi il tuo primo desiderio.", "empty_list": "Lista vuota. Lancia una moneta per aggiungere un desiderio.", "back": "Indietro", "edit": "Modifica", "delete": "Elimina", "restore": "Ripristina", "confirm_delete_list": "Eliminare la lista «{name}» e i suoi elementi? Verranno spostati nel cestino.", "confirm_delete_item": "Eliminare «{title}»? Verrà spostato nel cestino.", "trash": "Cestino", "empty_trash": "Svuota cestino", "purge_now": "Elimina definitivamente", "trash_empty": "Cestino vuoto.", "search": "Cerca…", "filter": "Filtro", "sort": "Ordina", "all": "Tutti", "sort_price": "Prezzo", "sort_priority": "Priorità", "sort_date": "Data", "sort_title": "Titolo", "title": "Titolo", "url": "Link (URL)", "price": "Prezzo", "currency": "Valuta", "image": "Immagine", "priority": "Priorità", "status": "Stato", "tags": "Etichette", "notes": "Note", "alta": "Alta", "media": "Media", "baixa": "Bassa", "desejado": "Desiderato", "comprado": "Acquistato", "arquivado": "Archiviato", "fetch_meta": "Recupera dati dal link", "fetch_short": "Recupera", "choose_image": "Scegli immagine", "replace_image": "Sostituisci immagine", "remove_image": "Rimuovi immagine", "list_name": "Nome della lista", "save": "Salva", "cancel": "Annulla", "create": "Crea", "rename": "Rinomina", "set_cover": "Imposta copertina", "new_item_title": "Nuovo elemento", "edit_item_title": "Modifica elemento", "stats_total": "Valore totale", "stats_by_status": "Per stato", "stats_by_priority": "Per priorità", "stats_by_tag": "Per etichetta", "stats_price_trend": "Andamento prezzo", "fetching": "Recupero metadati…", "fetch_ok": "Dati compilati dal link.", "fetch_partial": "Alcuni dati non sono stati trovati — compila manualmente.", "fetch_fail": "Impossibile leggere il link. Compila manualmente.", "price_updated": "{n} prezzo/i aggiornato/i.", "price_none": "Nessun elemento con link da aggiornare.", "no_price_change": "Nessuna variazione di prezzo.", "invalid_currency": "Codice valuta non valido (usa ISO 4217, es.: EUR).", "title_required": "Il titolo è obbligatorio.", "image_saved": "Immagine salvata.", "image_fail": "Impossibile ottenere l'immagine.", "gc_done": "{n} immagine/i orfana/e rimossa/e.", "gc_none": "Nessuna immagine orfana.", "clean_orphans": "Rimuovi immagini orfane", "deleted_at": "eliminato", "in_list": "in", "cover_set": "Copertina impostata.", "palette": "Palette grafici", "palette_reset": "Ripristina colori palette", "price_trend_none": "Nessuno storico prezzi ancora."},
};

const LOCALE_MAP = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' };
const LANG_LABELS = { pt: 'Português', en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', it: 'Italiano' };

// Strings do painel de Definições (i18n para os 6 idiomas)
Object.assign(I18N.pt, { set_datafile: 'Ficheiro de dados', set_datafile_desc: 'Caminho do JSON no cofre (fonte de verdade).', set_imagesfolder: 'Pasta de imagens', set_imagesfolder_desc: 'Onde as imagens são guardadas (por UUID).', set_currency: 'Moeda padrão', set_language: 'Idioma', set_retention: 'Retenção da lixeira (dias)', set_seed: 'Semear preço inicial no histórico', set_seed_desc: 'Guarda a 1.ª entrada de preço ao criar o item (dá dados às tendências).', set_preset: 'Preset', clean_orphans_desc: 'Remove imagens sem referência (só quando pedes).', default_list: 'Desejos' });
Object.assign(I18N.en, { set_datafile: 'Data file', set_datafile_desc: 'Path to the JSON in the vault (source of truth).', set_imagesfolder: 'Images folder', set_imagesfolder_desc: 'Where images are stored (by UUID).', set_currency: 'Default currency', set_language: 'Language', set_retention: 'Trash retention (days)', set_seed: 'Seed initial price in history', set_seed_desc: 'Saves the first price entry when creating an item (feeds the trends).', set_preset: 'Preset', clean_orphans_desc: 'Removes unreferenced images (only when you ask).', default_list: 'Wishes' });
Object.assign(I18N.es, { set_datafile: 'Archivo de datos', set_datafile_desc: 'Ruta del JSON en el cofre (fuente de verdad).', set_imagesfolder: 'Carpeta de imágenes', set_imagesfolder_desc: 'Dónde se guardan las imágenes (por UUID).', set_currency: 'Moneda predeterminada', set_language: 'Idioma', set_retention: 'Retención de la papelera (días)', set_seed: 'Registrar precio inicial en el historial', set_seed_desc: 'Guarda la primera entrada de precio al crear el artículo (alimenta las tendencias).', set_preset: 'Preajuste', clean_orphans_desc: 'Elimina imágenes sin referencia (solo cuando lo pides).', default_list: 'Deseos' });
Object.assign(I18N.de, { set_datafile: 'Datendatei', set_datafile_desc: 'Pfad zur JSON im Tresor (Quelle der Wahrheit).', set_imagesfolder: 'Bilderordner', set_imagesfolder_desc: 'Wo Bilder gespeichert werden (per UUID).', set_currency: 'Standardwährung', set_language: 'Sprache', set_retention: 'Aufbewahrung im Papierkorb (Tage)', set_seed: 'Anfangspreis im Verlauf speichern', set_seed_desc: 'Speichert den ersten Preiseintrag beim Erstellen des Artikels (liefert Daten für die Trends).', set_preset: 'Voreinstellung', clean_orphans_desc: 'Entfernt nicht referenzierte Bilder (nur auf Anforderung).', default_list: 'Wünsche' });
Object.assign(I18N.fr, { set_datafile: 'Fichier de données', set_datafile_desc: 'Chemin du JSON dans le coffre (source de vérité).', set_imagesfolder: 'Dossier des images', set_imagesfolder_desc: 'Où les images sont enregistrées (par UUID).', set_currency: 'Devise par défaut', set_language: 'Langue', set_retention: 'Conservation de la corbeille (jours)', set_seed: 'Enregistrer le prix initial dans l’historique', set_seed_desc: 'Enregistre la première entrée de prix à la création de l’article (alimente les tendances).', set_preset: 'Préréglage', clean_orphans_desc: 'Supprime les images non référencées (uniquement à ta demande).', default_list: 'Souhaits' });
Object.assign(I18N.it, { set_datafile: 'File di dati', set_datafile_desc: 'Percorso del JSON nel forziere (fonte di verità).', set_imagesfolder: 'Cartella immagini', set_imagesfolder_desc: 'Dove sono salvate le immagini (per UUID).', set_currency: 'Valuta predefinita', set_language: 'Lingua', set_retention: 'Conservazione del cestino (giorni)', set_seed: 'Registra il prezzo iniziale nella cronologia', set_seed_desc: 'Salva la prima voce di prezzo alla creazione dell’articolo (alimenta gli andamenti).', set_preset: 'Preset', clean_orphans_desc: 'Rimuove le immagini senza riferimento (solo su richiesta).', default_list: 'Desideri' });
Object.assign(I18N.pt, { location_updated: 'Localização atualizada.' });
Object.assign(I18N.en, { location_updated: 'Location updated.' });
Object.assign(I18N.es, { location_updated: 'Ubicación actualizada.' });
Object.assign(I18N.de, { location_updated: 'Speicherort aktualisiert.' });
Object.assign(I18N.fr, { location_updated: 'Emplacement mis à jour.' });
Object.assign(I18N.it, { location_updated: 'Posizione aggiornata.' });
Object.assign(I18N.pt, { path_taken: 'Já existe um ficheiro nesse caminho — escolhe outro.' });
Object.assign(I18N.en, { path_taken: 'A file already exists at that path — choose another.' });
Object.assign(I18N.es, { path_taken: 'Ya existe un archivo en esa ruta — elige otra.' });
Object.assign(I18N.de, { path_taken: 'Unter diesem Pfad existiert bereits eine Datei – wähle einen anderen.' });
Object.assign(I18N.fr, { path_taken: 'Un fichier existe déjà à cet emplacement — choisis-en un autre.' });
Object.assign(I18N.it, { path_taken: 'Esiste già un file in quel percorso — scegline un altro.' });
Object.assign(I18N.pt, { open_link: 'Abrir link', move_item: 'Mover para…', move_done: 'Item movido.', no_other_lists: 'Não há outras listas.', duplicate: 'Duplicar', copy_suffix: '(cópia)', mark_bought: 'Marcar como comprado', mark_wished: 'Marcar como desejado', more: 'Mais', export_md: 'Exportar para Markdown', exported: 'Lista exportada.', stats_scope_all: 'Todas as listas', sync_conflict: '{n} ficheiro(s) de conflito de sincronização em {dir}. Resolve-os.' });
Object.assign(I18N.en, { open_link: 'Open link', move_item: 'Move to…', move_done: 'Item moved.', no_other_lists: 'No other lists.', duplicate: 'Duplicate', copy_suffix: '(copy)', mark_bought: 'Mark as bought', mark_wished: 'Mark as wished', more: 'More', export_md: 'Export to Markdown', exported: 'List exported.', stats_scope_all: 'All lists', sync_conflict: '{n} sync-conflict file(s) in {dir}. Please resolve them.' });
Object.assign(I18N.es, { open_link: 'Abrir enlace', move_item: 'Mover a…', move_done: 'Artículo movido.', no_other_lists: 'No hay otras listas.', duplicate: 'Duplicar', copy_suffix: '(copia)', mark_bought: 'Marcar como comprado', mark_wished: 'Marcar como deseado', more: 'Más', export_md: 'Exportar a Markdown', exported: 'Lista exportada.', stats_scope_all: 'Todas las listas', sync_conflict: '{n} archivo(s) de conflicto de sincronización en {dir}. Resuélvelos.' });
Object.assign(I18N.de, { open_link: 'Link öffnen', move_item: 'Verschieben nach…', move_done: 'Artikel verschoben.', no_other_lists: 'Keine anderen Listen.', duplicate: 'Duplizieren', copy_suffix: '(Kopie)', mark_bought: 'Als gekauft markieren', mark_wished: 'Als gewünscht markieren', more: 'Mehr', export_md: 'Als Markdown exportieren', exported: 'Liste exportiert.', stats_scope_all: 'Alle Listen', sync_conflict: '{n} Sync-Konflikt-Datei(en) in {dir}. Bitte auflösen.' });
Object.assign(I18N.fr, { open_link: 'Ouvrir le lien', move_item: 'Déplacer vers…', move_done: 'Article déplacé.', no_other_lists: 'Aucune autre liste.', duplicate: 'Dupliquer', copy_suffix: '(copie)', mark_bought: 'Marquer comme acheté', mark_wished: 'Marquer comme souhaité', more: 'Plus', export_md: 'Exporter en Markdown', exported: 'Liste exportée.', stats_scope_all: 'Toutes les listes', sync_conflict: '{n} fichier(s) de conflit de synchronisation dans {dir}. À résoudre.' });
Object.assign(I18N.it, { open_link: 'Apri link', move_item: 'Sposta in…', move_done: 'Articolo spostato.', no_other_lists: 'Nessun’altra lista.', duplicate: 'Duplica', copy_suffix: '(copia)', mark_bought: 'Segna come comprato', mark_wished: 'Segna come desiderato', more: 'Altro', export_md: 'Esporta in Markdown', exported: 'Lista esportata.', stats_scope_all: 'Tutte le liste', sync_conflict: '{n} file di conflitto di sincronizzazione in {dir}. Da risolvere.' });
Object.assign(I18N.pt, { load_failed: 'Dados ilegíveis — o Trevi não gravou por cima. Verifica o ficheiro (modo só-leitura).', export_fail: 'Não foi possível exportar a lista.', no_results: 'Sem resultados para este filtro.' });
Object.assign(I18N.en, { load_failed: 'Unreadable data — Trevi did not overwrite. Check the file (read-only mode).', export_fail: 'Could not export the list.', no_results: 'No results for this filter.' });
Object.assign(I18N.es, { load_failed: 'Datos ilegibles — Trevi no sobrescribió. Revisa el archivo (modo solo lectura).', export_fail: 'No se pudo exportar la lista.', no_results: 'Sin resultados para este filtro.' });
Object.assign(I18N.de, { load_failed: 'Unlesbare Daten — Trevi hat nichts überschrieben. Prüfe die Datei (Nur-Lese-Modus).', export_fail: 'Liste konnte nicht exportiert werden.', no_results: 'Keine Ergebnisse für diesen Filter.' });
Object.assign(I18N.fr, { load_failed: 'Données illisibles — Trevi n’a rien écrasé. Vérifie le fichier (mode lecture seule).', export_fail: 'Impossible d’exporter la liste.', no_results: 'Aucun résultat pour ce filtre.' });
Object.assign(I18N.it, { load_failed: 'Dati illeggibili — Trevi non ha sovrascritto. Controlla il file (sola lettura).', export_fail: 'Impossibile esportare la lista.', no_results: 'Nessun risultato per questo filtro.' });
Object.assign(I18N.pt, { remove_cover: 'Remover capa', list_options: 'Opções da lista' });
Object.assign(I18N.en, { remove_cover: 'Remove cover', list_options: 'List options' });
Object.assign(I18N.es, { remove_cover: 'Quitar portada', list_options: 'Opciones de la lista' });
Object.assign(I18N.de, { remove_cover: 'Titelbild entfernen', list_options: 'Listenoptionen' });
Object.assign(I18N.fr, { remove_cover: 'Retirer la couverture', list_options: 'Options de la liste' });
Object.assign(I18N.it, { remove_cover: 'Rimuovi copertina', list_options: 'Opzioni della lista' });

/* ============================ Utilidades ============================ */
function uuid() {
	try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
	const b = new Uint8Array(16); crypto.getRandomValues(b);
	b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
	const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
	return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}
function nowISO() { return new Date().toISOString(); }
function isValidCurrency(c) { return typeof c === 'string' && /^[A-Z]{3}$/.test(c); }

// Parser de preço tolerante a "1.299,90", "1,299.90", "€ 349,90", "R$ 1.234,56".
function parsePrice(raw) {
	if (raw == null) return null;
	if (typeof raw === 'number') return isFinite(raw) ? raw : null;
	let s = String(raw).replace(/[^\d.,-]/g, '').trim();
	if (!s) return null;
	const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
	if (lastComma > -1 && lastDot > -1) {
		if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.'); // 1.299,90
		else s = s.replace(/,/g, ''); // 1,299.90
	} else if (lastComma > -1) {
		s = (s.length - lastComma - 1) <= 2 ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
	}
	const n = parseFloat(s);
	return isFinite(n) ? n : null;
}
function formatMoney(value, currency, locale) {
	const loc = LOCALE_MAP[locale] || 'en-US';
	if (typeof value !== 'number' || !isFinite(value)) value = 0;
	try { return new Intl.NumberFormat(loc, { style: 'currency', currency: isValidCurrency(currency) ? currency : 'EUR' }).format(value); }
	catch (e) { return `${value.toFixed(2)} ${currency || ''}`.trim(); }
}
function extFromContentType(ct, url) {
	ct = (ct || '').toLowerCase();
	if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
	if (ct.includes('png')) return 'png';
	if (ct.includes('webp')) return 'webp';
	if (ct.includes('gif')) return 'gif';
	if (ct.includes('svg')) return 'svg';
	const m = /\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.exec(url || '');
	if (m) return m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
	return 'jpg';
}

/* ============================ Store ============================ */
class Store {
	constructor(plugin) {
		this.plugin = plugin;
		this.data = { version: DATA_VERSION, settings: { ...DEFAULT_SETTINGS }, lists: [], trash: [] };
		this._saveTimer = null;
	}
	get adapter() { return this.plugin.app.vault.adapter; }
	get settings() { return this.data.settings; }
	get dataFile() { return normalizePath(this.plugin.bootstrap.dataFile); }

	async ensureFolders() {
		for (const p of [this.plugin.bootstrap.dataFile.replace(/\/[^/]*$/, ''), this.plugin.bootstrap.imagesFolder]) {
			const np = normalizePath(p);
			if (np && np !== '.' && !(await this.adapter.exists(np))) {
				try { await this.adapter.mkdir(np); } catch (e) {}
			}
		}
	}

	async load() {
		const path = this.dataFile;
		// candidatos de recuperação: principal, .bak e snapshots diários (mais recente primeiro)
		const candidates = [path, path + '.bak'];
		try {
			const dir = path.replace(/\/[^/]*$/, '') || '/';
			const base = path.split('/').pop();
			const re = new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.\\d{4}-\\d{2}-\\d{2}\\.bak$');
			const l = await this.adapter.list(normalizePath(dir));
			(l.files || []).filter((f) => re.test(f.split('/').pop())).sort().reverse().forEach((f) => candidates.push(f));
		} catch (e) {}
		let parsed = null, anyExisted = false;
		for (const p of candidates) {
			try {
				if (await this.adapter.exists(p)) {
					anyExisted = true;
					const obj = JSON.parse(await this.adapter.read(p));
					if (obj && Array.isArray(obj.lists)) { parsed = obj; break; }
				}
			} catch (e) { /* candidato corrompido — tenta o próximo */ }
		}
		if (parsed) {
			this.data = this._migrate(parsed);
			this.data.settings = Object.assign({ ...DEFAULT_SETTINGS }, this.data.settings || {});
			// caminhos são bootstrap, não settings: remove legado que possa existir no ficheiro
			delete this.data.settings.dataFile; delete this.data.settings.imagesFolder;
			if (!this.data.settings.paletteOverrides || typeof this.data.settings.paletteOverrides !== 'object') this.data.settings.paletteOverrides = {};
		} else if (anyExisted) {
			// ficheiros presentes mas TODOS ilegíveis: NÃO sobrescrever — modo só-leitura para permitir recuperação manual
			this._loadFailed = true;
			new Notice(this.plugin.t('load_failed'));
			return;
		} else {
			await this.ensureFolders();
			await this.save(true);
		}
		this._purgeExpiredTrash();
	}

	_migrate(obj) {
		if (!obj.version) obj.version = DATA_VERSION;
		if (!Array.isArray(obj.trash)) obj.trash = [];
		if (!Array.isArray(obj.lists)) obj.lists = [];
		obj.version = DATA_VERSION;
		return obj;
	}

	scheduleSave() {
		if (this._loadFailed) return; // dados ilegíveis — não gravar por cima
		if (this._saveTimer) clearTimeout(this._saveTimer);
		this._saveTimer = setTimeout(() => { this._saveTimer = null; this.save(); }, 700);
	}

	async save(silentEnsure) {
		if (this._loadFailed) return; // dados ilegíveis — não gravar por cima
		try {
			if (!silentEnsure) await this.ensureFolders();
			const path = this.dataFile;
			const payload = JSON.stringify(this.data, null, 2);
			if (!payload || payload.length < 2) return;
			try { if (await this.adapter.exists(path)) { const prev = await this.adapter.read(path); await this.adapter.write(path + '.bak', prev); } } catch (e) {}
			await this.adapter.write(path, payload);
			// snapshot diário rotativo (mantém os 5 mais recentes)
			try {
				const day = new Date().toISOString().slice(0, 10);
				const snap = path + '.' + day + '.bak';
				if (!(await this.adapter.exists(snap))) { await this.adapter.write(snap, payload); await this._pruneSnapshots(path); }
			} catch (e) {}
		} catch (e) {
			console.error('Trevi: falha ao gravar', e);
			new Notice('Trevi: falha ao gravar os dados.');
		}
	}

	async _pruneSnapshots(path, keep) {
		keep = keep || 5;
		try {
			const dir = path.replace(/\/[^/]*$/, '') || '/';
			const base = path.split('/').pop();
			const re = new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.\\d{4}-\\d{2}-\\d{2}\\.bak$');
			const l = await this.adapter.list(normalizePath(dir));
			const snaps = (l.files || []).filter((f) => re.test(f.split('/').pop())).sort();
			for (const f of snaps.slice(0, Math.max(0, snaps.length - keep))) { try { await this.adapter.remove(normalizePath(f)); } catch (e) {} }
		} catch (e) {}
	}

	async flush() { if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; } await this.save(); }

	/* ---- listas ---- */
	getList(id) { return this.data.lists.find((l) => l.id === id) || null; }
	createList(name) {
		const l = { id: uuid(), name: name || 'Nova lista', cover: '', createdAt: nowISO(), updatedAt: nowISO(), items: [] };
		this.data.lists.push(l); this.scheduleSave(); return l;
	}
	renameList(id, name) { const l = this.getList(id); if (l) { l.name = name; l.updatedAt = nowISO(); this.scheduleSave(); } }
	setCover(id, imageUuid) { const l = this.getList(id); if (l) { l.cover = imageUuid || ''; l.updatedAt = nowISO(); this.scheduleSave(); } }
	async deleteList(id) {
		const idx = this.data.lists.findIndex((l) => l.id === id);
		if (idx < 0) return;
		const [l] = this.data.lists.splice(idx, 1);
		this.data.trash.push({ trashId: uuid(), type: 'list', deletedAt: nowISO(), payload: l });
		this.scheduleSave();
	}

	/* ---- itens ---- */
	createItem(listId, data) {
		const l = this.getList(listId); if (!l) return null;
		const price = parsePrice(data.price);
		const it = {
			id: uuid(), title: data.title || '', url: data.url || '',
			price: price == null ? 0 : price, currency: isValidCurrency(data.currency) ? data.currency : this.settings.defaultCurrency,
			image: data.image || '', priority: PRIORITIES.includes(data.priority) ? data.priority : 'media',
			status: STATUSES.includes(data.status) ? data.status : 'desejado',
			tags: Array.isArray(data.tags) ? data.tags : [], notes: data.notes || '',
			priceHistory: [], createdAt: nowISO(), updatedAt: nowISO(),
		};
		if (this.settings.seedInitialHistory && price != null && price > 0) it.priceHistory.push({ date: nowISO(), price });
		l.items.push(it); l.updatedAt = nowISO(); this.scheduleSave(); return it;
	}
	updateItem(listId, itemId, data) {
		const l = this.getList(listId); if (!l) return;
		const it = l.items.find((x) => x.id === itemId); if (!it) return;
		const newPrice = parsePrice(data.price);
		if (newPrice != null && newPrice !== it.price) it.priceHistory.push({ date: nowISO(), price: newPrice });
		Object.assign(it, {
			title: data.title != null ? data.title : it.title,
			url: data.url != null ? data.url : it.url,
			price: newPrice != null ? newPrice : it.price,
			currency: isValidCurrency(data.currency) ? data.currency : it.currency,
			image: data.image != null ? data.image : it.image,
			priority: PRIORITIES.includes(data.priority) ? data.priority : it.priority,
			status: STATUSES.includes(data.status) ? data.status : it.status,
			tags: Array.isArray(data.tags) ? data.tags : it.tags,
			notes: data.notes != null ? data.notes : it.notes,
			updatedAt: nowISO(),
		});
		l.updatedAt = nowISO(); this.scheduleSave();
	}
	deleteItem(listId, itemId) {
		const l = this.getList(listId); if (!l) return;
		const idx = l.items.findIndex((x) => x.id === itemId); if (idx < 0) return;
		const [it] = l.items.splice(idx, 1);
		this.data.trash.push({ trashId: uuid(), type: 'item', listId, listName: l.name, deletedAt: nowISO(), payload: it });
		l.updatedAt = nowISO(); this.scheduleSave();
	}
	recordPrice(item, newPrice) {
		if (newPrice == null || newPrice === item.price) return false;
		item.priceHistory.push({ date: nowISO(), price: newPrice });
		item.price = newPrice; item.updatedAt = nowISO(); this.scheduleSave(); return true;
	}
	moveItem(fromId, itemId, toId) {
		const from = this.getList(fromId), to = this.getList(toId);
		if (!from || !to || from === to) return;
		const idx = from.items.findIndex((x) => x.id === itemId); if (idx < 0) return;
		const [it] = from.items.splice(idx, 1); to.items.push(it);
		from.updatedAt = nowISO(); to.updatedAt = nowISO(); this.scheduleSave();
	}
	duplicateItem(listId, itemId) {
		const l = this.getList(listId); if (!l) return null;
		const it = l.items.find((x) => x.id === itemId); if (!it) return null;
		const clone = JSON.parse(JSON.stringify(it));
		clone.id = uuid(); clone.createdAt = nowISO(); clone.updatedAt = nowISO();
		clone.title = ((it.title || '') + ' ' + this.plugin.t('copy_suffix')).trim();
		l.items.push(clone); l.updatedAt = nowISO(); this.scheduleSave(); return clone;
	}
	cycleBought(listId, itemId) {
		const l = this.getList(listId); if (!l) return;
		const it = l.items.find((x) => x.id === itemId); if (!it) return;
		it.status = it.status === 'comprado' ? 'desejado' : 'comprado'; it.updatedAt = nowISO(); l.updatedAt = nowISO(); this.scheduleSave();
	}

	/* ---- lixeira ---- */
	restoreTrash(trashId) {
		const idx = this.data.trash.findIndex((t) => t.trashId === trashId); if (idx < 0) return;
		const [t] = this.data.trash.splice(idx, 1);
		if (t.type === 'list') this.data.lists.push(t.payload);
		else { let l = this.getList(t.listId); if (!l) l = this.createList(t.listName || this.plugin.t('default_list')); l.items.push(t.payload); l.updatedAt = nowISO(); }
		this.scheduleSave();
	}
	async purgeTrash(trashId) {
		const idx = this.data.trash.findIndex((t) => t.trashId === trashId); if (idx < 0) return;
		this.data.trash.splice(idx, 1); this.scheduleSave();
		await this.plugin.images.collectOrphans();
	}
	async emptyTrash() { this.data.trash = []; this.scheduleSave(); await this.plugin.images.collectOrphans(); }
	_purgeExpiredTrash() {
		const days = Number(this.settings.trashRetentionDays) || 0;
		if (days <= 0) return;
		const cutoff = Date.now() - days * 86400000;
		const before = this.data.trash.length;
		this.data.trash = this.data.trash.filter((t) => new Date(t.deletedAt).getTime() >= cutoff);
		if (this.data.trash.length !== before) this.scheduleSave();
	}

	/* conjunto de UUIDs de imagem vivos (capas + itens, ativos E na lixeira) */
	referencedImageIds() {
		const ref = new Set();
		const addList = (l) => { if (l.cover) ref.add(l.cover); (l.items || []).forEach((it) => { if (it.image) ref.add(it.image); }); };
		this.data.lists.forEach(addList);
		this.data.trash.forEach((t) => { if (t.type === 'list') addList(t.payload); else if (t.payload && t.payload.image) ref.add(t.payload.image); });
		return ref;
	}
}

/* ============================ ImageStore ============================ */
class ImageStore {
	constructor(plugin) { this.plugin = plugin; }
	get adapter() { return this.plugin.app.vault.adapter; }
	get folder() { return normalizePath(this.plugin.bootstrap.imagesFolder); }

	async ensure() { if (!(await this.adapter.exists(this.folder))) { try { await this.adapter.mkdir(this.folder); } catch (e) {} } }

	async _find(id) {
		try {
			const l = await this.adapter.list(this.folder);
			return (l.files || []).find((f) => f.split('/').pop().startsWith(id + '.')) || null;
		} catch (e) { return null; }
	}
	async resourcePath(id) {
		if (!id) return null;
		const f = await this._find(id);
		return f ? this.adapter.getResourcePath(normalizePath(f)) : null;
	}
	async saveArrayBuffer(buf, ext) {
		await this.ensure();
		const id = uuid();
		await this.adapter.writeBinary(normalizePath(`${this.folder}/${id}.${ext || 'jpg'}`), buf);
		return id;
	}
	async saveFromFile(file) {
		const buf = await file.arrayBuffer();
		const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
		return this.saveArrayBuffer(buf, ext === 'jpeg' ? 'jpg' : ext);
	}
	async saveFromUrl(url) {
		if (!/^https?:\/\//i.test(url)) return null;
		try {
			const res = await requestUrl({ url, method: 'GET', throw: false });
			if (res.status >= 400 || !res.arrayBuffer) return null;
			const ct = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || '';
			if (ct && !ct.toLowerCase().startsWith('image/')) return null;
			return this.saveArrayBuffer(res.arrayBuffer, extFromContentType(ct, url));
		} catch (e) { return null; }
	}
	// GC — SÓ chamado por ações destrutivas do utilizador (nunca automático/por sync).
	async collectOrphans() {
		await this.ensure();
		const ref = this.plugin.store.referencedImageIds();
		let removed = 0;
		try {
			const l = await this.adapter.list(this.folder);
			for (const f of (l.files || [])) {
				const name = f.split('/').pop();
				const id = name.replace(/\.[^.]*$/, '');
				if (!ref.has(id)) { try { await this.adapter.remove(normalizePath(f)); removed++; } catch (e) {} }
			}
		} catch (e) {}
		return removed;
	}
}

/* ============================ Captura de metadados ============================ */
class MetadataFetcher {
	constructor(plugin) { this.plugin = plugin; this.extractors = []; }
	// Extensibilidade (spec §9): adaptadores por loja. Cada um: { match(url):bool, extract(doc,url,out):void }.
	// Ex.: plugin.meta.register({ match:(u)=>/loja\.exemplo/.test(u), extract:(doc,u,out)=>{ out.price = parsePrice(doc.querySelector('.preco')?.textContent); } });
	register(extractor) { if (extractor && typeof extractor.match === 'function' && typeof extractor.extract === 'function') this.extractors.push(extractor); }
	async fetch(url) {
		const out = { title: null, image: null, price: null };
		if (!/^https?:\/\//i.test(url)) return out;
		let html;
		try { const res = await requestUrl({ url, method: 'GET', throw: false }); if (res.status >= 400) return out; html = res.text; }
		catch (e) { return out; }
		let doc;
		try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return out; }
		// 1) adaptadores por domínio (têm precedência sobre o genérico)
		for (const ex of this.extractors) { try { if (ex.match(url)) ex.extract(doc, url, out); } catch (e) {} }
		// 2) genérico Open Graph + JSON-LD preenche o que ainda faltar
		this._generic(doc, url, out);
		return out;
	}
	_generic(doc, url, out) {
		const meta = (sel) => { const el = doc.querySelector(sel); return el ? (el.getAttribute('content') || '').trim() : null; };
		if (!out.title) out.title = meta('meta[property="og:title"]') || meta('meta[name="og:title"]') || (doc.querySelector('title') ? doc.querySelector('title').textContent.trim() : null);
		if (!out.image) out.image = meta('meta[property="og:image"]') || meta('meta[name="og:image"]');
		if (out.price == null) out.price = parsePrice(meta('meta[property="product:price:amount"]') || meta('meta[property="og:price:amount"]') || meta('meta[name="twitter:data1"]'));
		if (out.price == null || !out.image || !out.title) {
			const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
			for (const sc of scripts) {
				let json; try { json = JSON.parse(sc.textContent); } catch (e) { continue; }
				const nodes = [];
				const collect = (o) => { if (!o) return; if (Array.isArray(o)) o.forEach(collect); else if (typeof o === 'object') { nodes.push(o); if (o['@graph']) collect(o['@graph']); } };
				collect(json);
				const prod = nodes.find((n) => { const t = n['@type']; return t === 'Product' || (Array.isArray(t) && t.includes('Product')); });
				if (prod) {
					if (!out.title && prod.name) out.title = String(prod.name).trim();
					if (!out.image && prod.image) { let img = Array.isArray(prod.image) ? prod.image[0] : prod.image; if (img && typeof img === 'object') img = img.url; if (typeof img === 'string') out.image = img; }
					if (out.price == null && prod.offers) { const off = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers; if (off && off.price != null) out.price = parsePrice(off.price); }
				}
			}
		}
	}
}

/* ============================ Estatísticas ============================ */
function computeStats(lists) {
	const totalsByCurrency = {}, byStatus = {}, byPriority = {}, byTag = {};
	let count = 0;
	for (const l of lists) for (const it of l.items) {
		count++;
		totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] || 0) + (Number(it.price) || 0);
		byStatus[it.status] = (byStatus[it.status] || 0) + 1;
		byPriority[it.priority] = (byPriority[it.priority] || 0) + 1;
		(it.tags || []).forEach((t) => { byTag[t] = (byTag[t] || 0) + 1; });
	}
	return { totalsByCurrency, byStatus, byPriority, byTag, count };
}

/* ============================ SVG + UI helpers ============================ */
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(parent, name, attrs) {
	const el = document.createElementNS(SVGNS, name);
	for (const k in attrs) el.setAttribute(k, attrs[k]);
	if (parent) parent.appendChild(el);
	return el;
}
function renderSparkline(container, history, colors, width) {
	colors = colors || {};
	const pts = (history || []).map((h) => Number(h.price)).filter((n) => isFinite(n));
	if (pts.length < 2) { container.createSpan({ text: '—', cls: 'trevi-muted' }); return; }
	const w = width || 120, h = 28, pad = 2;
	const min = Math.min(...pts), max = Math.max(...pts), range = (max - min) || 1;
	const up = pts[pts.length - 1] >= pts[0];
	const color = up ? (colors.up || PALETTE.terracota) : (colors.down || PALETTE.agua);
	const svg = svgEl(container, 'svg', { width: w, height: h, class: 'trevi-spark' });
	const d = pts.map((p, i) => { const x = pad + (i / (pts.length - 1)) * (w - 2 * pad); const y = h - pad - ((p - min) / range) * (h - 2 * pad); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ');
	svgEl(svg, 'path', { d, fill: 'none', stroke: color, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
	const trend = container.createSpan({ cls: 'trevi-trend', text: up ? '▲' : '▼' });
	trend.style.color = color;
}
function mkIc(parent, name, cls) { const s = parent.createSpan({ cls: 'trevi-ic' + (cls ? ' ' + cls : '') }); setIcon(s, name); return s; }
function iconBtn(parent, name, label, onclick) { const b = parent.createEl('button', { cls: 'trevi-iconbtn' }); setIcon(b, name); if (label) { b.setAttr('aria-label', label); b.setAttr('title', label); } if (onclick) b.onclick = onclick; return b; }
function hexA(hex, a) { const n = parseInt(String(hex).slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
function badgeEl(parent, text, color) { const b = parent.createSpan({ cls: 'trevi-badge', text }); b.style.color = color; b.style.background = hexA(color, 0.15); b.style.borderColor = hexA(color, 0.34); return b; }
function renderBars(container, entries) {
	const max = Math.max(1, ...entries.map((e) => e[1]));
	const wrap = container.createDiv({ cls: 'trevi-bars' });
	for (const [, val, label, color] of entries) {
		const row = wrap.createDiv({ cls: 'trevi-bar-row' });
		row.createSpan({ cls: 'trevi-bar-label', text: label });
		const track = row.createDiv({ cls: 'trevi-bar-track' });
		const fill = track.createDiv({ cls: 'trevi-bar-fill' });
		fill.style.width = Math.round((val / max) * 100) + '%';
		fill.style.background = color || PALETTE.agua;
		row.createSpan({ cls: 'trevi-bar-val', text: String(val) });
	}
}

/* ============================ View ============================ */
class TreviView extends ItemView {
	constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.state = { screen: 'piazza', listId: null }; this.filters = { q: '', status: '', priority: '', sort: 'date' }; this.statsScope = ''; }
	getViewType() { return VIEW_TYPE; }
	getDisplayText() { return 'Trevi'; }
	getIcon() { return 'trevi-fountain'; }
	async onOpen() { this.contentEl.addClass('trevi'); this.render(); }
	async onClose() {}
	t(k, vars) { return this.plugin.t(k, vars); }

	go(screen, listId) { this.state = { screen, listId: listId || null }; if (screen === 'list') this.filters = { q: '', status: '', priority: '', sort: 'date' }; this.render(); }

	render() {
		const c = this.contentEl; c.empty();
		try { c.style.setProperty('--trevi-accent', this.plugin.palette().agua); } catch (e) {}
		if (this.state.screen === 'piazza') this.renderPiazza(c);
		else if (this.state.screen === 'list') this.renderList(c);
		else if (this.state.screen === 'stats') this.renderStats(c);
		else if (this.state.screen === 'trash') this.renderTrash(c);
	}

	screenHeader(c, opts) {
		const bar = c.createDiv({ cls: 'trevi-header' });
		if (opts.back) { const b = bar.createEl('button', { cls: 'trevi-back' }); mkIc(b, 'chevron-left'); b.createSpan({ text: this.t('back') }); b.onclick = () => this.go('piazza'); }
		const h = bar.createEl('h2', { cls: 'trevi-title' });
		if (opts.icon) mkIc(h, opts.icon);
		h.createSpan({ cls: 'trevi-title-text', text: opts.title });
		return bar.createDiv({ cls: 'trevi-actions' });
	}

	renderPiazza(c) {
		const actions = this.screenHeader(c, { icon: 'trevi-fountain', title: this.t('piazza') });
		const cta = actions.createEl('button', { cls: 'trevi-cta' }); mkIc(cta, 'plus'); cta.createSpan({ text: this.t('new_list') });
		cta.onclick = () => new NameModal(this.plugin, this.t('new_list'), this.t('list_name'), '', (name) => { const l = this.plugin.store.createList(name); this.go('list', l.id); }).open();
		iconBtn(actions, 'bar-chart-3', this.t('open_stats'), () => this.go('stats'));
		iconBtn(actions, 'trash-2', this.t('trash'), () => this.go('trash'));

		const lists = this.plugin.store.data.lists;
		if (!lists.length) { const e = c.createDiv({ cls: 'trevi-empty' }); mkIc(e, 'trevi-fountain'); e.createDiv({ text: this.t('empty_piazza') }); return; }
		const grid = c.createDiv({ cls: 'trevi-grid' });
		for (const l of lists) {
			const card = grid.createDiv({ cls: 'trevi-card' });
			const cover = card.createDiv({ cls: 'trevi-cover' });
			mkIc(cover, 'trevi-fountain');
			if (l.cover) this.plugin.images.resourcePath(l.cover).then((p) => { if (p) { cover.empty(); cover.createEl('img', { attr: { src: p, alt: l.name } }); } });
			const body = card.createDiv({ cls: 'trevi-card-body' });
			body.createDiv({ cls: 'trevi-card-name', text: l.name });
			const totals = {}; l.items.forEach((it) => { totals[it.currency] = (totals[it.currency] || 0) + (Number(it.price) || 0); });
			const cur = this.plugin.store.settings.defaultCurrency;
			let totalStr = formatMoney(totals[cur] || 0, cur, this.plugin.store.settings.language);
			const others = Object.keys(totals).filter((k) => k !== cur && totals[k] > 0);
			if (others.length) totalStr += ` +${others.length}`;
			body.createDiv({ cls: 'trevi-card-meta', text: `${l.items.length} ${l.items.length === 1 ? this.t('item') : this.t('items')} · ${totalStr}` });
			const open = () => this.go('list', l.id);
			card.setAttr('tabindex', '0'); card.setAttr('role', 'button'); card.setAttr('aria-label', l.name);
			card.onclick = open;
			card.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); open(); } };
		}
	}

	renderList(c) {
		const l = this.plugin.store.getList(this.state.listId);
		if (!l) { this.go('piazza'); return; }
		const actions = this.screenHeader(c, { back: true, title: l.name });
		const cta = actions.createEl('button', { cls: 'trevi-cta' }); mkIc(cta, 'coins'); cta.createSpan({ text: this.t('add_item') });
		cta.onclick = () => new ItemModal(this.plugin, l.id, null, () => this.refreshList(l)).open();
		iconBtn(actions, 'more-vertical', this.t('list_options'), (e) => this.showListMenu(e, l));

		const tb = c.createDiv({ cls: 'trevi-toolbar' });
		const sw = tb.createDiv({ cls: 'trevi-searchwrap' }); mkIc(sw, 'search');
		const search = sw.createEl('input', { cls: 'trevi-search', attr: { type: 'text', placeholder: this.t('search'), enterkeyhint: 'search' } });
		search.value = this.filters.q; search.oninput = () => { this.filters.q = search.value.toLowerCase(); this.renderItems(itemsWrap, l); };
		const filters = tb.createDiv({ cls: 'trevi-filters' });
		const stSel = filters.createEl('select'); stSel.createEl('option', { value: '', text: this.t('status') + ': ' + this.t('all') });
		STATUSES.forEach((s) => stSel.createEl('option', { value: s, text: this.t(s) }));
		stSel.value = this.filters.status; stSel.onchange = () => { this.filters.status = stSel.value; this.renderItems(itemsWrap, l); };
		const prSel = filters.createEl('select'); prSel.createEl('option', { value: '', text: this.t('priority') + ': ' + this.t('all') });
		PRIORITIES.forEach((p) => prSel.createEl('option', { value: p, text: this.t(p) }));
		prSel.value = this.filters.priority; prSel.onchange = () => { this.filters.priority = prSel.value; this.renderItems(itemsWrap, l); };
		const sortSel = filters.createEl('select');
		[['date', this.t('sort_date')], ['price', this.t('sort_price')], ['priority', this.t('sort_priority')], ['title', this.t('sort_title')]].forEach(([v, lbl]) => sortSel.createEl('option', { value: v, text: this.t('sort') + ': ' + lbl }));
		sortSel.value = this.filters.sort; sortSel.onchange = () => { this.filters.sort = sortSel.value; this.renderItems(itemsWrap, l); };

		const itemsWrap = c.createDiv({ cls: 'trevi-items' });
		this._itemsWrap = itemsWrap;
		this.renderItems(itemsWrap, l);
	}

	// re-render só dos itens (preserva scroll/cabeçalho) para mutações a nível de item; senão, render completo
	refreshList(l) { if (this.state.screen === 'list' && this._itemsWrap) this.renderItems(this._itemsWrap, l); else this.render(); }

	renderItems(wrap, l) {
		wrap.empty();
		const f = this.filters;
		let items = l.items.filter((it) => {
			if (f.status && it.status !== f.status) return false;
			if (f.priority && it.priority !== f.priority) return false;
			if (f.q) { const hay = (it.title + ' ' + (it.notes || '') + ' ' + (it.tags || []).join(' ')).toLowerCase(); if (!hay.includes(f.q)) return false; }
			return true;
		});
		const prRank = { alta: 0, media: 1, baixa: 2 };
		items.sort((a, b) => {
			if (f.sort === 'price') return (b.price || 0) - (a.price || 0);
			if (f.sort === 'priority') return prRank[a.priority] - prRank[b.priority];
			if (f.sort === 'title') return (a.title || '').localeCompare(b.title || '');
			return new Date(b.createdAt) - new Date(a.createdAt);
		});
		if (!items.length) { const e = wrap.createDiv({ cls: 'trevi-empty' }); mkIc(e, 'trevi-fountain'); e.createDiv({ text: l.items.length ? this.t('no_results') : this.t('empty_list') }); return; }
		for (const it of items) this.renderItemCard(wrap, l, it);
	}

	renderItemCard(wrap, l, it) {
		const pal = this.plugin.palette();
		const card = wrap.createDiv({ cls: 'trevi-item' });
		// área clicável/focável (thumb + info) — NÃO engloba os botões de ação (evita aninhamento ARIA inválido)
		const main = card.createDiv({ cls: 'trevi-item-main' });
		const thumb = main.createDiv({ cls: 'trevi-thumb' });
		mkIc(thumb, 'trevi-fountain');
		if (it.image) this.plugin.images.resourcePath(it.image).then((p) => { if (p) { thumb.empty(); thumb.createEl('img', { attr: { src: p, alt: it.title } }); } });
		const info = main.createDiv({ cls: 'trevi-item-info' });
		info.createDiv({ cls: 'trevi-item-title', text: it.title });
		const meta = info.createDiv({ cls: 'trevi-item-meta' });
		meta.createSpan({ cls: 'trevi-price', text: formatMoney(it.price, it.currency, this.plugin.store.settings.language) });
		badgeEl(meta, this.t(it.priority), pal[PRIORITY_PAL[it.priority]]);
		badgeEl(meta, this.t(it.status), pal[STATUS_PAL[it.status]]);
		if (it.priceHistory && it.priceHistory.length > 1) renderSparkline(meta, it.priceHistory, { up: pal.terracota, down: pal.agua });
		const open = () => new ItemModal(this.plugin, l.id, it, () => this.refreshList(l)).open();
		main.setAttr('tabindex', '0'); main.setAttr('role', 'button'); main.setAttr('aria-label', it.title || this.t('item'));
		main.onclick = open;
		main.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === main) { e.preventDefault(); open(); } };
		const btns = card.createDiv({ cls: 'trevi-item-actions' });
		const bought = it.status === 'comprado';
		const mb = iconBtn(btns, 'check', bought ? this.t('mark_wished') : this.t('mark_bought'), (e) => { e.stopPropagation(); this.plugin.store.cycleBought(l.id, it.id); this.refreshList(l); });
		if (bought) mb.style.color = pal.latao;
		iconBtn(btns, 'more-vertical', this.t('more'), (e) => { e.stopPropagation(); this.showItemMenu(e, l, it); });
	}

	showItemMenu(evt, l, it) {
		const menu = new Menu();
		menu.addItem((i) => i.setTitle(this.t('edit')).setIcon('pencil').onClick(() => new ItemModal(this.plugin, l.id, it, () => this.refreshList(l)).open()));
		if (it.url) menu.addItem((i) => i.setTitle(this.t('open_link')).setIcon('external-link').onClick(() => { const u = /^https?:\/\//i.test(it.url) ? it.url : 'https://' + it.url; try { window.open(u, '_blank', 'noopener'); } catch (e) {} }));
		if (it.url) menu.addItem((i) => i.setTitle(this.t('update_this_price')).setIcon('refresh-cw').onClick(async () => { await this.plugin.updateItemPrice(l.id, it.id); this.refreshList(l); }));
		if (it.image) menu.addItem((i) => i.setTitle(this.t('set_cover')).setIcon('image').onClick(() => { this.plugin.store.setCover(l.id, it.image); new Notice(this.t('cover_set')); }));
		menu.addItem((i) => i.setTitle(this.t('move_item')).setIcon('arrow-right').onClick(() => new PickListModal(this.plugin, l.id, (toId) => { this.plugin.store.moveItem(l.id, it.id, toId); new Notice(this.t('move_done')); this.refreshList(l); }).open()));
		menu.addItem((i) => i.setTitle(this.t('duplicate')).setIcon('copy').onClick(() => { this.plugin.store.duplicateItem(l.id, it.id); this.refreshList(l); }));
		menu.addSeparator();
		menu.addItem((i) => i.setTitle(this.t('delete')).setIcon('trash-2').onClick(() => new ConfirmModal(this.plugin, this.t('confirm_delete_item', { title: it.title }), () => { this.plugin.store.deleteItem(l.id, it.id); this.refreshList(l); }).open()));
		try { menu.showAtMouseEvent(evt); } catch (e) { if (menu.showAtPosition) menu.showAtPosition({ x: 0, y: 0 }); }
	}

	showListMenu(evt, l) {
		const menu = new Menu();
		menu.addItem((i) => i.setTitle(this.t('set_cover')).setIcon('image').onClick(() => this.chooseCover(l)));
		if (l.cover) menu.addItem((i) => i.setTitle(this.t('remove_cover')).setIcon('x').onClick(() => { this.plugin.store.setCover(l.id, ''); new Notice(this.t('cover_set')); }));
		menu.addItem((i) => i.setTitle(this.t('rename')).setIcon('pencil').onClick(() => new NameModal(this.plugin, this.t('rename'), this.t('list_name'), l.name, (name) => { this.plugin.store.renameList(l.id, name); this.render(); }).open()));
		menu.addItem((i) => i.setTitle(this.t('export_md')).setIcon('download').onClick(() => this.plugin.exportList(l.id)));
		menu.addSeparator();
		menu.addItem((i) => i.setTitle(this.t('delete')).setIcon('trash-2').onClick(() => new ConfirmModal(this.plugin, this.t('confirm_delete_list', { name: l.name }), async () => { await this.plugin.store.deleteList(l.id); this.go('piazza'); }).open()));
		try { menu.showAtMouseEvent(evt); } catch (e) { if (menu.showAtPosition) menu.showAtPosition({ x: 0, y: 0 }); }
	}
	chooseCover(l) {
		const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
		input.onchange = async () => {
			if (!input.files || !input.files[0]) return;
			try { const id = await this.plugin.images.saveFromFile(input.files[0]); this.plugin.store.setCover(l.id, id); new Notice(this.plugin.t('cover_set')); }
			catch (e) { new Notice(this.plugin.t('image_fail')); }
		};
		input.click();
	}

	renderStats(c) {
		this.screenHeader(c, { back: true, icon: 'bar-chart-3', title: this.t('open_stats') });
		const pal = this.plugin.palette();
		const lang = this.plugin.store.settings.language;
		const allLists = this.plugin.store.data.lists;
		if (this.statsScope && !allLists.some((l) => l.id === this.statsScope)) this.statsScope = '';
		if (allLists.length > 1) {
			const tb = c.createDiv({ cls: 'trevi-toolbar' }); const fl = tb.createDiv({ cls: 'trevi-filters' });
			const sel = fl.createEl('select');
			sel.createEl('option', { value: '', text: this.t('stats_scope_all') });
			allLists.forEach((l) => sel.createEl('option', { value: l.id, text: l.name }));
			sel.value = this.statsScope || '';
			sel.onchange = () => { this.statsScope = sel.value; this.render(); };
		}
		const scoped = this.statsScope ? allLists.filter((l) => l.id === this.statsScope) : allLists;
		const s = computeStats(scoped);
		const kpis = c.createDiv({ cls: 'trevi-kpis' });
		const curKeys = Object.keys(s.totalsByCurrency);
		if (!curKeys.length) { const k = kpis.createDiv({ cls: 'trevi-kpi' }); k.createDiv({ cls: 'trevi-kpi-val', text: '—' }); k.createDiv({ cls: 'trevi-kpi-lbl', text: this.t('stats_total') }); }
		curKeys.forEach((cur) => { const k = kpis.createDiv({ cls: 'trevi-kpi' }); k.createDiv({ cls: 'trevi-kpi-val', text: formatMoney(s.totalsByCurrency[cur], cur, lang) }); k.createDiv({ cls: 'trevi-kpi-lbl', text: `${this.t('stats_total')} (${cur})` }); });
		const kc = kpis.createDiv({ cls: 'trevi-kpi' }); kc.createDiv({ cls: 'trevi-kpi-val', text: String(s.count) }); kc.createDiv({ cls: 'trevi-kpi-lbl', text: this.t('items') });

		const bs = c.createDiv({ cls: 'trevi-stat-block' }); bs.createEl('h3', { text: this.t('stats_by_status') });
		renderBars(bs, STATUSES.filter((k) => s.byStatus[k]).map((k) => [k, s.byStatus[k] || 0, this.t(k), pal[STATUS_PAL[k]]]));
		const bp = c.createDiv({ cls: 'trevi-stat-block' }); bp.createEl('h3', { text: this.t('stats_by_priority') });
		renderBars(bp, PRIORITIES.filter((k) => s.byPriority[k]).map((k) => [k, s.byPriority[k] || 0, this.t(k), pal[PRIORITY_PAL[k]]]));

		const tagEntries = Object.entries(s.byTag).sort((a, b) => b[1] - a[1]).slice(0, 8);
		if (tagEntries.length) {
			const bt = c.createDiv({ cls: 'trevi-stat-block' }); bt.createEl('h3', { text: this.t('stats_by_tag') });
			renderBars(bt, tagEntries.map((e, i) => [e[0], e[1], e[0], pal[CYCLE[i % CYCLE.length]]]));
		}

		const bTrend = c.createDiv({ cls: 'trevi-stat-block' }); bTrend.createEl('h3', { text: this.t('stats_price_trend') });
		const withHist = [];
		scoped.forEach((l) => l.items.forEach((it) => { if (it.priceHistory && it.priceHistory.length > 1) withHist.push(it); }));
		if (!withHist.length) { const e = bTrend.createDiv({ cls: 'trevi-empty' }); mkIc(e, 'bar-chart-3'); e.createDiv({ text: this.t('price_trend_none') }); }
		else {
			const list = bTrend.createDiv({ cls: 'trevi-trend-list' });
			for (const it of withHist.slice(0, 12)) {
				const row = list.createDiv({ cls: 'trevi-trend-row' });
				row.createDiv({ cls: 'trevi-trend-name', text: it.title });
				const spk = row.createDiv({ cls: 'trevi-trend-spark' });
				renderSparkline(spk, it.priceHistory, { up: pal.terracota, down: pal.agua }, 150);
				const first = it.priceHistory[0].price, last = it.priceHistory[it.priceHistory.length - 1].price;
				const pct = first ? ((last - first) / first) * 100 : 0;
				const chg = row.createSpan({ cls: 'trevi-trend-pct', text: (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%' });
				chg.style.color = pct > 0 ? pal.terracota : (pct < 0 ? pal.agua : 'var(--text-muted)');
			}
		}
	}

	renderTrash(c) {
		this.screenHeader(c, { back: true, icon: 'trash-2', title: this.t('trash') });
		const trash = this.plugin.store.data.trash;
		if (trash.length) { const tb = c.createDiv({ cls: 'trevi-toolbar' }); const eb = tb.createEl('button', { cls: 'trevi-ghostbtn', text: this.t('empty_trash') }); eb.onclick = () => new ConfirmModal(this.plugin, this.t('empty_trash') + '?', async () => { await this.plugin.store.emptyTrash(); this.render(); }).open(); }
		if (!trash.length) { const e = c.createDiv({ cls: 'trevi-empty' }); mkIc(e, 'trash-2'); e.createDiv({ text: this.t('trash_empty') }); return; }
		const wrap = c.createDiv({ cls: 'trevi-items' });
		for (const tr of trash.slice().reverse()) {
			const card = wrap.createDiv({ cls: 'trevi-item' });
			const info = card.createDiv({ cls: 'trevi-item-info' });
			info.createDiv({ cls: 'trevi-item-title', text: tr.type === 'list' ? (tr.payload.name || '') : (tr.payload.title || '') });
			info.createDiv({ cls: 'trevi-item-meta trevi-muted', text: `${this.t('deleted_at')} ${new Date(tr.deletedAt).toLocaleDateString()}${tr.type === 'item' ? ' · ' + this.t('in_list') + ' ' + (tr.listName || '') : ''}` });
			const btns = card.createDiv({ cls: 'trevi-item-actions' });
			iconBtn(btns, 'rotate-ccw', this.t('restore'), () => { this.plugin.store.restoreTrash(tr.trashId); this.render(); });
			iconBtn(btns, 'x', this.t('purge_now'), () => new ConfirmModal(this.plugin, this.t('purge_now') + '?', async () => { await this.plugin.store.purgeTrash(tr.trashId); this.render(); }).open());
		}
	}
}

/* ============================ Modais ============================ */
class NameModal extends Modal {
	constructor(plugin, title, label, initial, onSubmit) { super(plugin.app); this.plugin = plugin; this._title = title; this._label = label; this._initial = initial || ''; this.onSubmit = onSubmit; }
	onOpen() {
		this.titleEl.setText(this._title);
		let value = this._initial;
		new Setting(this.contentEl).setName(this._label).addText((t) => { t.setValue(value).onChange((v) => value = v); t.inputEl.focus(); t.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }); });
		const submit = () => { if (value.trim()) { this.onSubmit(value.trim()); this.close(); } };
		new Setting(this.contentEl).addButton((b) => b.setButtonText(this.plugin.t('cancel')).onClick(() => this.close())).addButton((b) => b.setButtonText(this.plugin.t('save')).setCta().onClick(submit));
	}
	onClose() { this.contentEl.empty(); }
}

class ConfirmModal extends Modal {
	constructor(plugin, message, onConfirm) { super(plugin.app); this.plugin = plugin; this.message = message; this.onConfirm = onConfirm; }
	onOpen() { this.contentEl.createEl('p', { text: this.message }); new Setting(this.contentEl).addButton((b) => b.setButtonText(this.plugin.t('cancel')).onClick(() => this.close())).addButton((b) => b.setButtonText(this.plugin.t('delete')).setWarning().onClick(async () => { this.close(); await this.onConfirm(); })); }
	onClose() { this.contentEl.empty(); }
}

class ItemModal extends Modal {
	constructor(plugin, listId, item, onDone) {
		super(plugin.app); this.plugin = plugin; this.listId = listId; this.item = item; this.onDone = onDone;
		this.data = item ? { title: item.title, url: item.url, price: item.price, currency: item.currency, image: item.image, priority: item.priority, status: item.status, tags: (item.tags || []).join(', '), notes: item.notes } :
			{ title: '', url: '', price: '', currency: plugin.store.settings.defaultCurrency, image: '', priority: 'media', status: 'desejado', tags: '', notes: '' };
	}
	field(parent, label) { const f = parent.createDiv({ cls: 'trevi-field' }); f.createEl('label', { text: label }); return f; }
	select(parent, options, value, onChange) { const s = parent.createEl('select'); options.forEach(([v, lbl]) => s.createEl('option', { value: v, text: lbl })); s.value = value; s.onchange = () => onChange(s.value); return s; }
	onOpen() {
		const t = (k, v) => this.plugin.t(k, v);
		this.modalEl.addClass('trevi-item-modal');
		const c = this.contentEl;
		c.createDiv({ cls: 'trevi-modal-title', text: this.item ? t('edit_item_title') : t('new_item_title') });
		const form = c.createDiv({ cls: 'trevi-form' });

		const fUrl = this.field(form, t('url'));
		const urlRow = fUrl.createDiv({ cls: 'trevi-field-row' });
		const urlInput = urlRow.createEl('input', { attr: { type: 'url', placeholder: 'https://…' } });
		urlInput.value = this.data.url; urlInput.oninput = () => this.data.url = urlInput.value; this._urlInput = urlInput;
		const fetchBtn = urlRow.createEl('button', { cls: 'trevi-ghostbtn' }); mkIc(fetchBtn, 'refresh-cw'); fetchBtn.createSpan({ text: t('fetch_short') });
		this._fetchBtn = fetchBtn;
		fetchBtn.onclick = () => this.doFetch();

		const fTitle = this.field(form, t('title'));
		const titleInput = fTitle.createEl('input', { attr: { type: 'text' } });
		titleInput.value = this.data.title; titleInput.oninput = () => this.data.title = titleInput.value; this._titleInput = titleInput;

		const two1 = form.createDiv({ cls: 'trevi-two' });
		const fPrice = this.field(two1, t('price'));
		const priceInput = fPrice.createEl('input', { attr: { type: 'text', inputmode: 'decimal' } });
		priceInput.value = this.data.price === '' ? '' : String(this.data.price); priceInput.oninput = () => this.data.price = priceInput.value; this._priceInput = priceInput;
		const fCur = this.field(two1, t('currency'));
		const curOpts = CURRENCIES.map((cur) => [cur, cur]);
		if (!CURRENCIES.includes(this.data.currency)) curOpts.push([this.data.currency, this.data.currency]);
		this.select(fCur, curOpts, this.data.currency, (v) => this.data.currency = v);

		const fImg = form.createDiv({ cls: 'trevi-field trevi-image-field' });
		this._imgPreview = fImg.createDiv({ cls: 'trevi-img-preview' });
		this.refreshImgPreview();
		const imgActions = fImg.createDiv({ cls: 'trevi-image-actions' });
		const chooseBtn = imgActions.createEl('button', { cls: 'trevi-ghostbtn', text: this.data.image ? t('replace_image') : t('choose_image') });
		chooseBtn.onclick = () => this.pickImage();
		if (this.data.image) { const rmBtn = imgActions.createEl('button', { cls: 'trevi-ghostbtn', text: t('remove_image') }); rmBtn.onclick = () => { this.data.image = ''; this.refreshImgPreview(); chooseBtn.setText(t('choose_image')); rmBtn.remove(); }; }

		const two2 = form.createDiv({ cls: 'trevi-two' });
		this.select(this.field(two2, t('priority')), PRIORITIES.map((p) => [p, t(p)]), this.data.priority, (v) => this.data.priority = v);
		this.select(this.field(two2, t('status')), STATUSES.map((s) => [s, t(s)]), this.data.status, (v) => this.data.status = v);

		const fTags = this.field(form, t('tags'));
		const tagsInput = fTags.createEl('input', { attr: { type: 'text', placeholder: 'a, b, c' } });
		tagsInput.value = this.data.tags; tagsInput.oninput = () => this.data.tags = tagsInput.value;

		const fNotes = this.field(form, t('notes'));
		const notesInput = fNotes.createEl('textarea');
		notesInput.value = this.data.notes; notesInput.oninput = () => this.data.notes = notesInput.value;

		const footer = form.createDiv({ cls: 'trevi-form-footer' });
		const cancel = footer.createEl('button', { cls: 'trevi-ghostbtn', text: t('cancel') }); cancel.onclick = () => this.close();
		const save = footer.createEl('button', { cls: 'trevi-primary', text: t('save') }); save.onclick = () => this.submit();
	}
	async refreshImgPreview() {
		this._imgPreview.empty();
		if (this.data.image) { const p = await this.plugin.images.resourcePath(this.data.image); if (p) { this._imgPreview.createEl('img', { attr: { src: p } }); return; } }
		mkIc(this._imgPreview, 'trevi-fountain');
	}
	pickImage() {
		const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
		input.onchange = async () => {
			if (!input.files || !input.files[0]) return;
			try { const id = await this.plugin.images.saveFromFile(input.files[0]); this.data.image = id; new Notice(this.plugin.t('image_saved')); this.refreshImgPreview(); }
			catch (e) { new Notice(this.plugin.t('image_fail')); }
		};
		input.click();
	}
	async doFetch() {
		const url = (this._urlInput && this._urlInput.value) || this.data.url;
		if (!/^https?:\/\//i.test(url)) { new Notice(this.plugin.t('fetch_fail')); return; }
		const btn = this._fetchBtn; if (btn) { btn.disabled = true; btn.addClass('is-loading'); }
		new Notice(this.plugin.t('fetching'));
		try {
			const meta = await this.plugin.meta.fetch(url);
			let got = 0;
			if (meta.title) { this.data.title = meta.title; if (this._titleInput) this._titleInput.value = meta.title; got++; }
			if (meta.price != null) { this.data.price = meta.price; if (this._priceInput) this._priceInput.value = String(meta.price); got++; }
			if (meta.image) { const id = await this.plugin.images.saveFromUrl(meta.image); if (id) { this.data.image = id; this.refreshImgPreview(); got++; } }
			new Notice(got === 0 ? this.plugin.t('fetch_fail') : (got < 3 ? this.plugin.t('fetch_partial') : this.plugin.t('fetch_ok')));
		} finally { if (btn) { btn.disabled = false; btn.removeClass('is-loading'); } }
	}
	submit() {
		if (!this.data.title || !this.data.title.trim()) { new Notice(this.plugin.t('title_required')); return; }
		if (this.data.currency && !isValidCurrency(this.data.currency)) { new Notice(this.plugin.t('invalid_currency')); return; }
		const payload = Object.assign({}, this.data, { tags: this.data.tags.split(',').map((s) => s.trim()).filter(Boolean) });
		if (this.item) this.plugin.store.updateItem(this.listId, this.item.id, payload);
		else this.plugin.store.createItem(this.listId, payload);
		this.close(); if (this.onDone) this.onDone();
	}
	onClose() { this.contentEl.empty(); }
}

class PickListModal extends Modal {
	constructor(plugin, excludeId, onPick) { super(plugin.app); this.plugin = plugin; this.excludeId = excludeId; this.onPick = onPick; }
	onOpen() {
		this.modalEl.addClass('trevi-item-modal');
		this.titleEl.setText(this.plugin.t('move_item'));
		const c = this.contentEl;
		const lists = this.plugin.store.data.lists.filter((l) => l.id !== this.excludeId);
		if (!lists.length) { c.createEl('p', { cls: 'trevi-muted', text: this.plugin.t('no_other_lists') }); return; }
		const wrap = c.createDiv({ cls: 'trevi-picklist' });
		for (const l of lists) { const b = wrap.createEl('button', { cls: 'trevi-ghostbtn', text: l.name }); b.onclick = () => { this.onPick(l.id); this.close(); }; }
	}
	onClose() { this.contentEl.empty(); }
}

/* ============================ Settings tab ============================ */
class TreviSettingTab extends PluginSettingTab {
	constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
	display() {
		const { containerEl } = this; containerEl.empty();
		const s = this.plugin.store.settings; const bs = this.plugin.bootstrap; const t = (k) => this.plugin.t(k);
		containerEl.createEl('h2', { text: 'Trevi' });

		new Setting(containerEl).setName(t('set_datafile')).setDesc(t('set_datafile_desc')).addText((tx) => {
			tx.setValue(bs.dataFile);
			const apply = async () => {
				const nv = (tx.getValue() || '').trim() || BOOTSTRAP_DEFAULTS.dataFile; const old = bs.dataFile;
				if (nv === old) return;
				await this.plugin.store.flush(); // sem gravações debounced pendentes a apontar para o caminho antigo
				const ok = await this.plugin.migrateDataFile(old, nv);
				if (!ok) { new Notice(t('path_taken')); tx.setValue(old); return; }
				bs.dataFile = nv; await this.plugin.saveData(bs); await this.plugin.store.flush(); new Notice(t('location_updated'));
			};
			tx.inputEl.addEventListener('blur', apply);
			tx.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tx.inputEl.blur(); } });
		});
		new Setting(containerEl).setName(t('set_imagesfolder')).setDesc(t('set_imagesfolder_desc')).addText((tx) => {
			tx.setValue(bs.imagesFolder);
			const apply = async () => { const nv = (tx.getValue() || '').trim() || BOOTSTRAP_DEFAULTS.imagesFolder; if (nv === bs.imagesFolder) return; const old = bs.imagesFolder; await this.plugin.migrateImages(old, nv); bs.imagesFolder = nv; await this.plugin.saveData(bs); await this.plugin.images.ensure(); this.plugin.refreshViews(); new Notice(t('location_updated')); };
			tx.inputEl.addEventListener('blur', apply);
			tx.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tx.inputEl.blur(); } });
		});
		new Setting(containerEl).setName(t('set_currency')).addText((tx) => tx.setValue(s.defaultCurrency).onChange(async (v) => { const up = (v || '').toUpperCase(); if (isValidCurrency(up)) { s.defaultCurrency = up; await this.plugin.store.save(); } }));
		new Setting(containerEl).setName(t('set_language')).addDropdown((d) => { Object.keys(LANG_LABELS).forEach((k) => d.addOption(k, LANG_LABELS[k])); d.setValue(s.language).onChange(async (v) => { s.language = v; await this.plugin.store.save(); this.plugin.registerCommands(); this.plugin.refreshViews(); this.display(); }); });
		new Setting(containerEl).setName(t('set_retention')).addText((tx) => { tx.inputEl.type = 'number'; tx.setValue(String(s.trashRetentionDays)).onChange(async (v) => { const n = parseInt(v, 10); s.trashRetentionDays = isFinite(n) && n >= 0 ? n : DEFAULT_SETTINGS.trashRetentionDays; await this.plugin.store.save(); }); });
		new Setting(containerEl).setName(t('set_seed')).setDesc(t('set_seed_desc')).addToggle((tg) => tg.setValue(!!s.seedInitialHistory).onChange(async (v) => { s.seedInitialHistory = v; await this.plugin.store.save(); }));

		containerEl.createEl('h3', { text: t('palette') });
		new Setting(containerEl).setName(t('set_preset')).addDropdown((d) => { Object.keys(PALETTES).forEach((k) => d.addOption(k, k.charAt(0).toUpperCase() + k.slice(1))); d.setValue(s.palette).onChange(async (v) => { s.palette = v; await this.plugin.store.save(); this.plugin.refreshViews(); this.display(); }); });
		const pal = this.plugin.palette();
		Object.keys(PALETTE_LABELS).forEach((name) => {
			new Setting(containerEl).setName(PALETTE_LABELS[name]).addColorPicker((cp) => cp.setValue(pal[name]).onChange(async (v) => { s.paletteOverrides = s.paletteOverrides || {}; s.paletteOverrides[name] = v; await this.plugin.store.save(); this.plugin.refreshViews(); }));
		});
		new Setting(containerEl).addButton((b) => b.setButtonText(t('palette_reset')).onClick(async () => { s.paletteOverrides = {}; await this.plugin.store.save(); this.plugin.refreshViews(); this.display(); }));

		new Setting(containerEl).setName(t('clean_orphans')).setDesc(t('clean_orphans_desc')).addButton((b) => b.setButtonText(t('clean_orphans')).onClick(async () => { const n = await this.plugin.images.collectOrphans(); new Notice(n ? t('gc_done').replace('{n}', n) : t('gc_none')); }));
	}
}

/* ============================ Plugin ============================ */
class TreviPlugin extends Plugin {
	t(key, vars) {
		const lang = (this.store && this.store.settings.language) || 'pt';
		let s = (I18N[lang] && I18N[lang][key]) != null ? I18N[lang][key] : (I18N.pt[key] != null ? I18N.pt[key] : key);
		if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
		return s;
	}
	palette() {
		const base = PALETTES[this.store.settings.palette] || PALETTES.trevi;
		return Object.assign({}, base, this.store.settings.paletteOverrides || {});
	}

	async onload() {
		addIcon('trevi-fountain', FOUNTAIN_ICON);
		this.bootstrap = Object.assign({}, BOOTSTRAP_DEFAULTS, (await this.loadData()) || {});
		this.store = new Store(this);
		this.images = new ImageStore(this);
		this.meta = new MetadataFetcher(this);
		await this.store.load();

		this.registerView(VIEW_TYPE, (leaf) => new TreviView(leaf, this));
		this.addRibbonIcon('trevi-fountain', 'Trevi', () => this.activateView());
		this.addSettingTab(new TreviSettingTab(this.app, this));
		this.registerCommands();
		this.checkSyncConflicts();
	}

	registerCommands() {
		this.addCommand({ id: 'open-piazza', name: this.t('open_piazza'), callback: () => this.activateView('piazza') });
		this.addCommand({ id: 'new-list', name: this.t('new_list'), callback: async () => { const v = await this.activateView('piazza'); new NameModal(this, this.t('new_list'), this.t('list_name'), '', (name) => { const l = this.store.createList(name); if (v) v.go('list', l.id); }).open(); } });
		this.addCommand({ id: 'add-manual', name: this.t('add_manual'), callback: async () => { const l = this.store.data.lists[0] || this.store.createList(this.t('default_list')); const v = await this.activateView('list', l.id); new ItemModal(this, l.id, null, () => v && v.render()).open(); } });
		this.addCommand({ id: 'update-all-prices', name: this.t('update_all_prices'), callback: () => this.updateAllPrices() });
		this.addCommand({ id: 'open-stats', name: this.t('open_stats'), callback: () => this.activateView('stats') });
	}

	async checkSyncConflicts() {
		try {
			const dir = normalizePath(this.bootstrap.dataFile.replace(/\/[^/]*$/, '') || '/');
			const l = await this.app.vault.adapter.list(dir);
			const conflicts = (l.files || []).filter((f) => /sync-conflict|\.conflict/i.test(f));
			if (conflicts.length) new Notice(this.t('sync_conflict', { n: conflicts.length, dir }));
		} catch (e) {}
	}

	_listToMarkdown(l) {
		const lang = this.store.settings.language;
		const totals = {}; l.items.forEach((it) => { totals[it.currency] = (totals[it.currency] || 0) + (Number(it.price) || 0); });
		const totalStr = Object.keys(totals).map((c) => formatMoney(totals[c], c, lang)).join(' · ');
		const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
		const lines = ['# ' + (l.name || ''), '', '> Trevi · ' + l.items.length + ' ' + (l.items.length === 1 ? this.t('item') : this.t('items')) + (totalStr ? ' · ' + totalStr : ''), ''];
		lines.push('| ' + [this.t('title'), this.t('price'), this.t('priority'), this.t('status'), this.t('url')].join(' | ') + ' |');
		lines.push('|---|---|---|---|---|');
		for (const it of l.items) {
			const link = it.url ? '[' + this.t('url') + '](' + it.url + ')' : '';
			lines.push('| ' + [cell(it.title), cell(formatMoney(it.price, it.currency, lang)), cell(this.t(it.priority)), cell(this.t(it.status)), link].join(' | ') + ' |');
		}
		lines.push('');
		return lines.join('\n');
	}
	async exportList(listId) {
		const l = this.store.getList(listId); if (!l) return;
		const a = this.app.vault.adapter;
		const dir = normalizePath(this.bootstrap.dataFile.replace(/\/[^/]*$/, '') || '');
		try { if (dir && dir !== '.' && !(await a.exists(dir))) await a.mkdir(dir); } catch (e) {}
		const safe = (l.name || 'lista').replace(/[\\/:*?"<>|#^[\]]/g, '-').trim() || 'lista';
		const base = (dir ? dir + '/' : '') + safe;
		const md = this._listToMarkdown(l);
		let path = base + '.md', n = 2, file = null;
		while (n < 60) {
			try { file = await this.app.vault.create(path, md); break; }
			catch (e) {
				// colisão de nome -> tenta o próximo; erro real -> aborta sem sobrescrever
				if (await a.exists(normalizePath(path))) { path = base + ' ' + (n++) + '.md'; continue; }
				console.error('Trevi export', e); break;
			}
		}
		if (!file) { new Notice(this.t('export_fail')); return; }
		new Notice(this.t('exported'));
		try { await this.app.workspace.getLeaf(false).openFile(file); } catch (e) {}
	}

	async onunload() { if (this.store) await this.store.flush(); }

	async activateView(screen, listId) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
		if (!leaf) { leaf = workspace.getLeaf(true); await leaf.setViewState({ type: VIEW_TYPE, active: true }); }
		workspace.revealLeaf(leaf);
		const view = leaf.view;
		if (view && screen) view.go(screen, listId);
		return view;
	}
	refreshViews() { this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((l) => { if (l.view && l.view.render) l.view.render(); }); }

	// Migração segura ao mudar o caminho do ficheiro de dados (move + .bak; copia-depois-remove).
	async migrateDataFile(oldPath, newPath) {
		const a = this.app.vault.adapter; const on = normalizePath(oldPath), nn = normalizePath(newPath);
		if (!on || on === nn) return true;
		try { if (await a.exists(nn)) return false; } catch (e) {} // recusa: nunca sobrescrever um ficheiro já existente no destino
		const dir = nn.replace(/\/[^/]*$/, ''); try { if (dir && dir !== '.' && !(await a.exists(dir))) await a.mkdir(dir); } catch (e) {}
		for (const suf of ['', '.bak']) {
			try { if (await a.exists(on + suf)) { const txt = await a.read(on + suf); await a.write(nn + suf, txt); await a.remove(on + suf); } } catch (e) {}
		}
		return true;
	}
	// Migração segura da pasta de imagens: move APENAS imagens do Trevi (nome UUID.ext); tenta remover a pasta antiga se ficar vazia.
	async migrateImages(oldFolder, newFolder) {
		const a = this.app.vault.adapter; const of = normalizePath(oldFolder), nf = normalizePath(newFolder);
		if (!of || of === nf) return;
		const IMG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif|svg)$/i;
		try { if (!(await a.exists(nf))) await a.mkdir(nf); } catch (e) {}
		try {
			const l = await a.list(of);
			for (const f of (l.files || [])) {
				const name = f.split('/').pop();
				if (!IMG.test(name)) continue; // só ficheiros geridos pelo Trevi; não tocar no JSON de dados nem em anexos alheios
				try { const buf = await a.readBinary(normalizePath(f)); await a.writeBinary(normalizePath(nf + '/' + name), buf); await a.remove(normalizePath(f)); } catch (e) {}
			}
		} catch (e) {}
		try { await a.rmdir(of, false); } catch (e) {} // só remove se ficou vazia
	}

	async updateItemPrice(listId, itemId) {
		const l = this.store.getList(listId); if (!l) return false;
		const it = l.items.find((x) => x.id === itemId); if (!it || !it.url) return false;
		const meta = await this.meta.fetch(it.url);
		const changed = meta.price != null && this.store.recordPrice(it, meta.price);
		new Notice(changed ? this.t('price_updated', { n: 1 }) : this.t('no_price_change'));
		return changed;
	}
	async updateAllPrices() {
		const withUrl = [];
		this.store.data.lists.forEach((l) => l.items.forEach((it) => { if (it.url) withUrl.push([l, it]); }));
		if (!withUrl.length) { new Notice(this.t('price_none')); return; }
		new Notice(this.t('fetching'));
		let changed = 0;
		for (const [, it] of withUrl) { try { const meta = await this.meta.fetch(it.url); if (meta.price != null && this.store.recordPrice(it, meta.price)) changed++; } catch (e) {} }
		new Notice(changed ? this.t('price_updated', { n: changed }) : this.t('no_price_change'));
		this.refreshViews();
	}
}

module.exports = TreviPlugin;
