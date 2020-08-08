//
// SAGE2 application: image_presenter
// by: Karel Vrabec <vrabekar@fit.cvut.cz>
//
// Copyright (c) 2019
//

var image_presenter = SAGE2_App.extend(
{	
	// ========================================
	// Hlavni funkce
	// ========================================

	init: function(data)
	{
		/* Vytvori aplikaci. */
		this.SAGE2Init("div", data);
		this.element.id = "div_" + data.id;
		
		this.element.style.backgroundColor = "#000";
		this.element.style.display = "flex";
		this.element.style.alignItems = "center"; // vertikalni zarovnani na stred
		this.element.style.justifyContent = "center"; // horizontalni zarovnani na stred

		this.resizeEvents = "continuous";
		this.moveEvents   = "continuous";
		this.maxFPS = 30.0;
		this.controls.finishedAddingControls();
		this.enableControls = true;

		this.current = 0; // aktualni snimek
		this.sort = 0; // aktualni razeni
		this.sort_direct = 0; // aktualni smer razeni
		this.trans = 0; // aktualni prechody
		this.presentation = 0; // aktualni stav prezentace
		
		this.images = []; // pole pro obrazky
		this.registerFileListHandler(this.loadImages); // aktualizuje pole pro obrazky vzdy po zmene FS
		this.createGUI(); // vytvori GUI
		this.slideshowInterval = 2000; // nastavi interval prochazeni obrazku
	}, // INIT
	
	load: function(date)
	{
		this.refresh(date);
	}, // LOAD

	draw: function(date)
	{
	}, // DRAW

	resize: function(date)
	{
		this.refresh(date);
	}, // RESIZE

	move: function(date)
	{
		this.refresh(date);
	}, // MOVE

	event: function(eventType, position, user_id, data, date)
	{
		if (eventType === "pointerRelease" && data.button === "left") // klikani levym tlacitkem mysi
		{
			this.checkBottomPanelIcons(position);
			this.checkLeftPanelItems(position);
			this.checkSettingsItems(position);
		} // if
		else if (eventType === "pointerScroll") // scrollovani
			this.isMouseInLeftPanel(position, data);
		else if (eventType === "pointerMove") // pohyb s mysi
			this.isMouseInBottomPanel(position);
		else if (eventType === "specialKey" && data.state === "down") // stisknuti nektere z klaves
		{
			switch (data.code)
			{
				case 13: // „Enter“
					this.startPresentation(); // spusti prezentaci
					break;
					
				case 37: // „←“
					this.setPreviousSlide(); // prepne na predchozi snimek
					break;
					
				case 38: // „↑“
					this.swapSlidesAbove(this.current - 1); // presune snimek vyse
					break;
					
				case 39: // „→“
					this.setNextSlide(); // prepne na nasledujici snimek
					break;
					
				case 40: // „↓“
					this.swapSlidesBelow(this.current + 1); // presune snimek nize
					break;
					
				case 46: // „Delete“
					this.deleteSlide(); // smaze snimek
					break;
					
				case 69: // „E“
					this.openOrCloseEditor(); // spusti nebo vypne editor
					break;
					
				case 72: // „H“
					this.openOrCloseHelp(); // spusti nebo vypne napovedu
					break;
					
				case 80: // „P“
					this.stopPresentation(); // zastavi prezentaci
					break;
					
				case 83: // „S“
					this.openOrCloseSettings(); // spusti nebo vypne nastaveni
					break;
					
				case 107: // „+“
					this.increaseSlideshowInterval(); // prodlouzi interval prochazeni
					break;
					
				case 109: // „-“
					this.decreaseSlideshowInterval(); // zkrati interval prochazeni
					break;
			} // switch
		} // else if
	}, // EVENT
	
	quit: function()
	{
	}, // QUIT

	// ========================================
	// GUI
	// ========================================

	/* Vytvori vsechny potrebne HTML prvky. */
	createGUI: function()
	{
		this.createLeftPanel();
		this.createRightPanel();
		this.createBottomPanel();
		this.createSettingsAndHelp();
		this.createInfobox();
		
		this.sortSlides(); // seradi slidy
		this.refreshAll(); // zaktualizuje vse
	}, // CREATE GUI

	// ========================================

	/* Vytvori levy panel a jeho prvky. */
	createLeftPanel: function()
	{
		/* Vytvori levy panel. */
		let left_panel = document.createElement("div");
		left_panel.setAttribute("id", "slideshow_lp");
		this.element.appendChild(left_panel);

		/* Vytvori obsah leveho panelu. */
		let left_panel_content = document.createElement("div");
		left_panel_content.setAttribute("id", "slideshow_lp_content");
		left_panel.appendChild(left_panel_content);

		/* Vytvori seznam obrazku. */
        let ul = document.createElement("ul");
		ul.setAttribute("id", "slideshow_lp_content_ul");
        left_panel_content.appendChild(ul);
		
		/* Vytvori polozky tohoto seznamu. */
        this.images.forEach(function generateItems(item, i)
		{
            let li = document.createElement("li");
            li.innerHTML = item.name;
			if (i == 0) li.classList.add("current");
            ul.appendChild(li);
        });
	}, // CREATE LEFT PANEL

	// ========================================

	/* Vytvori pravy panel a jeho prvky. */
	createRightPanel: function()
	{
		/* Vytvori pravy panel. */
		let right_panel = document.createElement("div");
		right_panel.setAttribute("id", "slideshow_rp");
		this.element.appendChild(right_panel);

		/* Vytvori obsah praveho panelu. */
		let right_panel_content = document.createElement("div");
		right_panel_content.setAttribute("id", "slideshow_rp_content");
		right_panel.appendChild(right_panel_content);

		/* Vytvori box pro obrazek. */
		let box_img = document.createElement("div");
		box_img.setAttribute("id", "rp_img_box_img");
		right_panel_content.appendChild(box_img);

		/* Vytvori box pro informace. */
		let box_info = document.createElement("div");
		box_info.setAttribute("id", "rp_img_box_info");
		right_panel_content.appendChild(box_info);
	
		// ========================================
	
		/* Vytvori rozliseni. */
		let resolution = document.createElement("span");
		resolution.setAttribute("id", "rp_img_resolution");
		box_img.appendChild(resolution);	

		// ========================================

		/* Vytvori kontejner pro nazev. */
		let name_container = document.createElement("div");
		name_container.setAttribute("class", "rp_containers");
		box_info.appendChild(name_container);
	
		/* Vytvori popisek nazvu. */
		let name_label = document.createElement("span");
		name_label.setAttribute("class", "rp_labels");
		name_label.innerHTML = "Název: ";
		name_container.appendChild(name_label);		

		/* Vytvori nazev. */
		let name = document.createElement("span");
		name.setAttribute("id", "rp_img_name");
		name_container.appendChild(name);	

		// ========================================

		/* Vytvori kontejner pro format. */
		let type_container = document.createElement("div");
		type_container.setAttribute("class", "rp_containers");
		box_info.appendChild(type_container);

		/* Vytvori popisek formatu. */
		let type_label = document.createElement("span");
		type_label.setAttribute("class", "rp_labels");
		type_label.innerHTML = "Formát: ";
		type_container.appendChild(type_label);
		
		/* Vytvori format. */
		let type = document.createElement("span");
		type.setAttribute("id", "rp_img_type");
		type_container.appendChild(type);
		
		// ========================================
		
		/* Vytvori kontejner pro velikost. */
		let size_container = document.createElement("div");
		size_container.setAttribute("class", "rp_containers");
		box_info.appendChild(size_container);

		/* Vytvori popisek velikosti. */
		let size_label = document.createElement("span");
		size_label.setAttribute("class", "rp_labels");
		size_label.innerHTML = "Velikost: ";
		size_container.appendChild(size_label);
		
		/* Vytvori velikost. */
		let size = document.createElement("span");
		size.setAttribute("id", "rp_img_size");
		size_container.appendChild(size);
		
		// ========================================
		
		/* Vytvori kontejner pro datum vyfoceni. */
		let create_date_container = document.createElement("div");
		create_date_container.setAttribute("class", "rp_containers");
		box_info.appendChild(create_date_container);

		/* Vytvori popisek data vyfoceni. */
		let create_date_label = document.createElement("span");
		create_date_label.setAttribute("class", "rp_labels");
		create_date_label.innerHTML = "Vyfoceno: ";
		create_date_container.appendChild(create_date_label);
		
		/* Vytvori datum vyfoceni. */
		let create_date = document.createElement("span");
		create_date.setAttribute("id", "rp_img_create_date");
		create_date_container.appendChild(create_date);	
	}, // CREATE RIGHT PANEL
	
	// ========================================

	/* Vytvori spodni panel a jeho prvky. */
	createBottomPanel: function()
	{
		/* Vytvori spodni panel. */
		let bottom_panel = document.createElement("div");
		bottom_panel.setAttribute("id", "slideshow_bp");
		this.element.appendChild(bottom_panel);

		/* Vytvori obsah spodniho panelu. */
		let bottom_panel_content = document.createElement("div");
		bottom_panel_content.setAttribute("id", "slideshow_bp_content");
		bottom_panel.appendChild(bottom_panel_content);

		/* Vytvori ikonky. */
		this.icons = [];
		src = [
			"icons/Play.png",
			"icons/Stop.png",
			"icons/Edit.png",
			"icons/Settings.png",
			"icons/Help.png"
		];
		for (let i = 0; i < src.length; i++)
		{
			img = new Image();
			img.src = this.resrcPath + src[i];
			img.setAttribute("class", "bp_img");
			bottom_panel_content.appendChild(img);
			this.icons.push(img);
		} // for
	}, // CREATE BOTTOM PANEL
	
	// ========================================

	/* Vytvori nastaveni a napovedu. */
	createSettingsAndHelp: function()
	{
		/* Vytvori nastaveni. */
		let settings = document.createElement("div");
		settings.setAttribute("id", "settings");
		this.element.appendChild(settings);
		
		/* Vytvori nadpis nastaveni. */
		let settings_h2 = document.createElement("h2");
		settings_h2.innerHTML = "Nastavení";
		settings.appendChild(settings_h2);

		// ========================================

		/* Vytvori box pro seznamy. */
		let ul_box = document.createElement("div");
		ul_box.setAttribute("id", "ul_box");
		settings.appendChild(ul_box);

		/* Vytvori box pro prechody. */
		let ul_box_trans = document.createElement("div");
		ul_box_trans.setAttribute("id", "ul_box_item_1");
		ul_box.appendChild(ul_box_trans);
		
		/* Vytvori box pro razeni. */
		let ul_box_sort = document.createElement("div");
		ul_box_sort.setAttribute("id", "ul_box_item_2");
		ul_box.appendChild(ul_box_sort);
		
		/* Vytvori box pro smery razeni. */
		let ul_box_direct = document.createElement("div");
		ul_box_direct.setAttribute("id", "ul_box_item_3");
		ul_box.appendChild(ul_box_direct);

		// ========================================

		let _this = this;

		/* Nastaveni prechodu. */
        let ul_trans_label = document.createElement("span");
		ul_trans_label.innerHTML = "Přechody:";
		ul_box_trans.appendChild(ul_trans_label);
		
		/* Seznam prechodu. */
        let ul_trans = document.createElement("ul");
		ul_trans.setAttribute("id", "ul_trans");
		trans = ["Žádné", "Plynulé", "Vodorovné", "Svislé"];
        trans.forEach(function generateItems(item, i)
		{
            let li = document.createElement("li");
            li.innerHTML = item;
			if (i == _this.trans) li.classList.add("current");
            ul_trans.appendChild(li);
        });
        ul_box_trans.appendChild(ul_trans);

		// ========================================

		/* Nastaveni razeni. */
        let ul_sort_label = document.createElement("span");
		ul_sort_label.innerHTML = "Řazení:";
		ul_box_sort.appendChild(ul_sort_label);
		
		/* Seznam razeni. */
        let ul_sort = document.createElement("ul");
		ul_sort.setAttribute("id", "ul_sort");
		sorts = ["Název", "Formát", "Velikost", "Datum vyfocení", "Rozlišení", "Vlastní"];
        sorts.forEach(function generateItems(item, i)
		{
            let li = document.createElement("li");
            li.innerHTML = item;
			if (i == _this.sort) li.classList.add("current");
            ul_sort.appendChild(li);
        });
        ul_box_sort.appendChild(ul_sort);

		// ========================================

		/* Nastaveni smeru razeni. */
        let ul_direct_label = document.createElement("span");
		ul_direct_label.innerHTML = "Směr řazení:";
		ul_box_direct.appendChild(ul_direct_label);
		
		/* Seznam smeru razeni. */
        let ul_direct = document.createElement("ul");
		ul_direct.setAttribute("id", "ul_direct");
		direct = ["Vzestupně", "Sestupně"];
        direct.forEach(function generateItems(item, i)
		{
            let li = document.createElement("li");
            li.innerHTML = item;
			if (i == _this.sort_direct) li.classList.add("current");
            ul_direct.appendChild(li);
        });
        ul_box_direct.appendChild(ul_direct);

		// ========================================
		
		/* Vytvori napovedu. */
		let help = document.createElement("div");
		help.setAttribute("id", "help");
		this.element.appendChild(help);
		
		/* Vytvori nadpis napovedy. */
		let help_h2 = document.createElement("h2");
		help_h2.innerHTML = "Nápověda";
		help.appendChild(help_h2);

		// ========================================

		/* Vytvori box. */
		let help_ul_box = document.createElement("div");
		help_ul_box.setAttribute("id", "ul_box");
		help.appendChild(help_ul_box);

		// ========================================

		/* Seznam klaves a jejich vyznamu. */
        let help_ul = document.createElement("ul");
		keys = {
			"Enter": "Spuštění prezentace",
			"P": "Zastavení prezentace",
			"E": "Editor",
			"S": "Nastavení",
			"H": "Nápověda",
			"←": "Předchozí snímek",
			"→": "Následující snímek",
			"↑": "Přesun snímku výše",
			"↓": "Přesun snímku níže",
			"Delete": "Odstranění snímku",
			"+": "Prodloužení intervalu procházení",
			"–": "Zkrácení intervalu procházení"
		};
		for (let i in keys)
		{
            let li = document.createElement("li");
			
			let key = document.createElement("span");
			key.innerHTML = i;
			li.appendChild(key);
			
			let meaning = document.createElement("span");
			meaning.innerHTML = keys[i];
			li.appendChild(meaning);
			
            help_ul.appendChild(li);
        };
        help_ul_box.appendChild(help_ul);
	}, // CREATE SETTINGS AND HELP

	// ========================================

	/* Vytvori infobox. */
	createInfobox: function()
	{
		let infobox = document.createElement("div");
		infobox.setAttribute("id", "slideshow_ibox");
		this.element.appendChild(infobox);
	}, // CREATE INFOBOX

	// ========================================
	// Nacitani obrazku
	// ========================================

	/* Nacita obrazky ze slozky „/user/images/“. */
	loadImages: function(fileList)
	{	
		let num_of_prev_imgs = this.images.length; // pocet obrazku pred zmenou FS
		this.images = []; // resetovani pole pro obrazky
		
		/* Prochazi obrazky ze seznamu vsech souboru. */
		for (f in fileList.images)
		{
			let img = fileList.images[f];
			if (img.sage2URL.startsWith("/user/images/")) // ulozi a prednacte obrazek z dane slozky
			{
				let c_date_parts = img.exif.CreateDate ? img.exif.CreateDate.split(/[: ]/) : ""
				
				image = new Image();
				image.src = img.sage2URL;
				
				this.images.push({
					"preload": image,
					"name": img.sage2URL.replace("/user/images/", ""),
					"src": img.sage2URL,
					"type":
						img.exif.FileType ? img.exif.FileType : "–",
					"size":
						img.exif.FileSize ? img.exif.FileSize : "–",
					"width":
						img.exif.ImageWidth ? img.exif.ImageWidth : "?",
					"height":
						img.exif.ImageHeight ? img.exif.ImageHeight : "?",
					"created":
						img.exif.CreateDate ?
						{
							"D": c_date_parts[2],
							"M": c_date_parts[1],
							"Y": c_date_parts[0].substr(2),
							"h": c_date_parts[3],
							"m": c_date_parts[4]
						} :
						{
							"D": "0",
							"M": "0",
							"Y": "0",
							"h": "0",
							"m": "0"
						},
				});
			} // if
		} // for
		
		/* Nenalezeny zadne obrazky. */
		let num_of_imgs = this.images.length; // pocet obrazku po zmene FS
		if (!num_of_imgs)
		{
			img = new Image();
			img.src = this.resrcPath + "images/No Images.jpg";
			
			this.images.push({
				"preload": img,
				"name": "–",
				"src": "–",
				"type": "–",
				"size": "–",
				"width": "?",
				"height": "?",
				"created":
					{
						"D": "0",
						"M": "0",
						"Y": "0",
						"h": "0",
						"m": "0"
					},
			});
		} // if
		
		/* Reaguje na zmeny FS. */
		let ul = document.getElementById("slideshow_lp_content_ul");
		if (!ul) return;
		
		if (!num_of_imgs) // vytvori polozku v pripade nenalezeni zadneho obrazku
		{
			let li = document.createElement("li");
			ul.appendChild(li);
		} // if
		
		if (num_of_imgs > num_of_prev_imgs) // pribyly obrazky
		{
			/* Prida polozky do seznamu. */
			let diff = num_of_imgs - num_of_prev_imgs;
			for (let i = 0; i < diff; i++)
			{
				let li = document.createElement("li");
				ul.appendChild(li);
			} // for
		} // if
		else if (num_of_imgs < num_of_prev_imgs) // ubyly obrazky
		{
			/* Odebere polozky ze seznamu. */
			let diff = num_of_prev_imgs - num_of_imgs;
			for (let i = 0; i < diff; i++)
				ul.removeChild(ul.childNodes[i]);
		} // else if
			
		this.stopSlideshow();
		this.sortSlides();
		this.refreshAll();
	}, // LOAD IMAGES

	// ========================================
	// Razeni
	// ========================================

	/* Seradi obrazky ruznymi zpusoby. */
	sortSlides: function()
	{
		if (this.sort == 0) // nazev
			this.sortByName();
		else if (this.sort == 1) // format
			this.sortByType();
		else if (this.sort == 2) // velikost
			this.sortBySize();
		else if (this.sort == 3) // datum vyfoceni
			this.sortByCreationDate();
		else if (this.sort == 4) // rozliseni
			this.sortByResolution();
		
		/* Zmeni nazvy polozek v levem menu. */
		let ul = document.getElementById("slideshow_lp_content_ul");
		let li = ul.getElementsByTagName("li");
		for (let i = 0; i < li.length; i++)
			li[i].innerHTML = this.images[i].name;
		
		this.setSlide(0); // nastavi prvni snimek
		ul.style.top = 0 + "px"; // posune seznam snimku dolu
	}, // SORT SLIDES

	// ========================================

	/* Seradi podle nazvu. */
	sortByName: function()
	{
		/* Vzestupne. */
		this.images.sort(function(a, b)
		{
			return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
		});
		
		/* Sestupne. */
		if (this.sort_direct) this.images.reverse();
	}, // SORT BY NAME

	// ========================================

	/* Seradi podle formatu. */
	sortByType: function()
	{
		/* Vzestupne. */
		this.images.sort(function(a, b)
		{
			return a.type.toLowerCase() < b.type.toLowerCase() ? -1 : 1;
		});
		
		/* Sestupne. */
		if (this.sort_direct) this.images.reverse();
	}, // SORT BY TYPE

	// ========================================
	
	/* Seradi podle velikosti. */
	sortBySize: function()
	{
		/* Vzestupne. */
		this.images.sort(function(a, b)
		{
			return a.size < b.size ? -1 : 1;
		});
		
		/* Sestupne. */
		if (this.sort_direct) this.images.reverse();
	}, // SORT BY SIZE
	
	// ========================================
	
	/* Seradi podle data vyfoceni. */
	sortByCreationDate: function()
	{
		/* Vzestupne. */
		this.images.sort(function(a, b)
		{
			if (a.created.Y < b.created.Y) return -1;
			else if (a.created.Y == b.created.Y)
			{
				if (a.created.M < b.created.M) return -1;
				else if (a.created.M == b.created.M)
				{
					if (a.created.D < b.created.D) return -1;
					else if (a.created.D == b.created.D)
					{
						if (a.created.h < b.created.h) return -1;
						else if (a.created.h == b.created.h)
						{
							if (a.created.m < b.created.m) return -1;
							else return 1;
						}
						else return 1;
					}
					else return 1;
				}
				else return 1;				
			}
			else return 1;
		});
		
		/* Sestupne. */
		if (this.sort_direct) this.images.reverse();
	}, // SORT BY CREATION DATE
	
	// ========================================
	
	/* Seradi podle rozliseni. */
	sortByResolution: function()
	{
		/* Vzestupne. */
		this.images.sort(function(a, b)
		{
			return (a.width * a.height) < (b.width * b.height) ? -1 : 1;
		});
		
		/* Sestupne. */
		if (this.sort_direct) this.images.reverse();
	}, // SORT BY RESOLUTION

	// ========================================
	// Prechody
	// ========================================

	/* Prochazi obrazky bez prechodu. */
	nextImageNoMode: function()
	{
		/* Aktualizuje obrazek ve slidu a v nahledu. */
		this.refreshAll();
		$("#slideshow_img, #rp_img").fadeIn(0);
		$("#slideshow_img").css({top: "0%", left: "0%"});

		/* Po urcite dobe prepne na dalsi obrazek. */
		let _this = this;
		this.slideshowTimer = setTimeout(function()
		{
			_this.current++; // posune se na dalsi obrazek
			if (_this.current >= _this.images.length) // zajisti opakovani prezentace
				_this.current = 0;			

			_this.highlightNextItem();
			_this.nextImageNoMode();
		}, this.slideshowInterval);
	}, // NEXT IMAGE NO MODE
	
	// ========================================
	
	/* Prochazi obrazky s plynulym prechodem. */
	nextImageFadeMode: function()
	{
		/* Aktualizuje obrazek ve slidu. */
		this.refreshAll(1);
		$("#slideshow_img").fadeIn(500);
		$("#slideshow_img").css({top: "0%", left: "0%"});
		$("#slideshow_img").delay(this.slideshowInterval - 1000).fadeOut(500);		
		
		/* Po urcite dobe prepne na dalsi obrazek. */
		let _this = this;
		this.slideshowTimer = setInterval(function()
		{
			_this.current++; // posune se na dalsi obrazek
			if (_this.current >= _this.images.length) // zajisti opakovani prezentace
				_this.current = 0;

			_this.refreshAll(1);
			_this.highlightNextItem();
			
			$("#slideshow_img").fadeIn(500);
			$("#slideshow_img").delay(_this.slideshowInterval - 1000).fadeOut(500);
		}, this.slideshowInterval);
	}, // NEXT IMAGE FADE MODE
	
	// ========================================
	
	/* Prochazi obrazky zleva doprava. */
	nextImageLeftToRight: function()
	{
		/* Aktualizuje obrazek ve slidu. */
		$("#slideshow_img").css({top: "0%", left: "0%"});
		
		/* Posune obrazek doleva od stredu. */
		let _this = this;
		$("#slideshow_img").delay(this.slideshowInterval - 1000).animate({left: "-100%"}, 500);
		
		$.when($("#slideshow_img")).then(function()
		{
			if (_this.stop_callbacks) return;
			
			_this.current++; // posune se na dalsi obrazek
			if (_this.current >= _this.images.length) // zajisti opakovani prezentace
				_this.current = 0;
				
			_this.refreshAll();
			_this.highlightNextItem();
			
			/* Posune obrazek doleva ke stredu. */
			$("#slideshow_img").css({left: "100%"});
			$("#slideshow_img").animate({left: "0%"}, 500);
		});
		
		this.slideshowTimer = setTimeout(function() {_this.nextImageLeftToRight();}, this.slideshowInterval);
	}, // NEXT IMAGE LEFT TO RIGHT

	// ========================================

	/* Prochazi obrazky shora dolu. */
	nextImageTopToBottom: function()
	{
		/* Aktualizuje obrazek ve slidu. */
		$("#slideshow_img").css({top: "0%", left: "0%"});
		
		/* Posune obrazek nahoru od stredu. */
		let _this = this;
		$("#slideshow_img").delay(this.slideshowInterval - 1000).animate({top: "-100%"}, 500);
		
		$.when($("#slideshow_img")).then(function()
		{
			if (_this.stop_callbacks) return;
			
			_this.current++; // posune se na dalsi obrazek
			if (_this.current >= _this.images.length) // zajisti opakovani prezentace
				_this.current = 0;

			_this.refreshAll();
			_this.highlightNextItem();
			
			/* Posune obrazek nahoru ke stredu. */
			$("#slideshow_img").css({top: "100%"});
			$("#slideshow_img").animate({top: "0%"}, 500);
		});
		
		this.slideshowTimer = setTimeout(function() {_this.nextImageTopToBottom();}, this.slideshowInterval);
	}, // NEXT IMAGE TOP TO BOTTOM

	// ========================================
	// Prezentace
	// ========================================

	/* Aktualizuje obrazek (ve slidu i v nahledu) a informace o nem. */
	refreshAll: function(fade = 0)
	{	
		/* Aktualizuje obrazek ve slidu. */
		let img_to_append = this.images[this.current].preload;
		img_to_append.setAttribute("id", "slideshow_img");
		if (fade) img_to_append.setAttribute("style", "display: none;");
		else img_to_append.setAttribute("style", "display: block;");
		
		let img = document.getElementById("slideshow_img");
		if (img) this.element.removeChild(img);
		this.element.appendChild(img_to_append);

		/* Aktualizuje nahled obrazku. */
		let img_info_to_append = img_to_append.cloneNode();
		img_info_to_append.setAttribute("id", "rp_img");
		if (fade) img_info_to_append.setAttribute("style", "display: block;");
		
		let parent = document.getElementById("rp_img_box_img");
		let img_info = document.getElementById("rp_img");		
		if (img_info) parent.removeChild(img_info);
		parent.insertBefore(img_info_to_append, parent.firstChild);
		
		/* Aktualizuje rozliseni. */
		let _this = this.images[this.current];
		img_info_to_append.onload = function()
		{
			let img_resolution = _this.width + " x " + _this.height + " px";
			document.getElementById("rp_img_resolution").innerHTML = img_resolution;
		} // ONLOAD

		/* Aktualizuje nazev. */
		let img_name = this.images[this.current].name;
		img_name = img_name.substr(0, img_name.indexOf("."));
		if (!img_name.length) img_name = "–";		
		document.getElementById("rp_img_name").innerHTML = img_name;
		
		/* Aktualizuje format. */
		let img_type = this.images[this.current].type;
		document.getElementById("rp_img_type").innerHTML = img_type;
		
		/* Aktualizuje velikost. */
		let img_size = parseInt(this.images[this.current].size);
		if (Number.isNaN(img_size)) img_size = "–";
		else img_size = String((parseInt(img_size) / 1000000).toFixed(3)).concat(" MB");
		document.getElementById("rp_img_size").innerHTML = img_size;
		
		/* Aktualizuje datum vytvoreni. */
		let c_date = this.images[this.current].created;
		if (!parseInt(c_date.D)) c_date = "–";
		else c_date = c_date.D + "/" + c_date.M + "/" + c_date.Y + " " + c_date.h + ":" + c_date.m;
		document.getElementById("rp_img_create_date").innerHTML = c_date;
	}, // REFRESH ALL

	// ========================================

	/* Prepne na dany slide. */
	setSlide: function(i)
	{
		this.current = i;
		this.refreshAll();
		
		/* Zvyrazni danou polozku. */
		$("#slideshow_lp_content_ul li.current").removeClass("current");
		$("#slideshow_lp_content_ul li").eq(i).addClass("current");
		
		/* Resetuje obrazek ve slidu a v nahledu. */
		$("#slideshow_img, #rp_img").fadeIn(0);
		$("#slideshow_img").css({top: "0%", left: "0%"});
	}, // SET SLIDE

	// ========================================

	/* Odstrani dany slide. */
	deleteSlide: function()
	{
		this.stopSlideshow();
		
		let old_current = this.current;
		this.setNextSlide();
		
		if (this.images.length >= 2)
		{
			let ul = document.getElementById("slideshow_lp_content_ul");
			ul.removeChild(ul.childNodes[old_current]); // odstrani prvek z leveho panelu
			this.images.splice(old_current, 1); // odstrani prvek z pole obrazku
			this.current--; // kvuli zmenseni pole se musi ukazatel na aktualni obrazek posunout zpet
			if (this.current < 0) this.current = 0 // smazani posledniho prvku
			
			this.setInfobox("Snímek smazán.");
		} // if
		else
			this.setInfobox("Prezentace musí obsahovat alespoň jeden obrázek.");
	}, // DELETE SLIDE

	// ========================================

	/* Prepne na predchozi snimek. */
	setPreviousSlide: function()
	{
		this.stopSlideshow();
		
		/* Posune se na predchozi obrazek. */
		this.current--;
		if (this.current < 0)
			this.current = this.images.length - 1;

		this.refreshAll();
		this.highlightPreviousItem();
		this.checkScrolling(this.current);
		
		/* Resetuje obrazek ve slidu a v nahledu. */
		$("#slideshow_img, #rp_img").fadeIn(0);
		$("#slideshow_img").css({top: "0%", left: "0%"});
		
		this.setInfobox("Předchozí snímek.");
	}, // SET PREVIOUS SLIDE
	
	// ========================================
	
	/* Prepne na dalsi snimek. */
	setNextSlide: function()
	{
		this.stopSlideshow();
		
		/* Posune se na dalsi obrazek. */
		this.current++;
		if (this.current >= this.images.length)
			this.current = 0;

		this.refreshAll();
		this.highlightNextItem();
		this.checkScrolling(this.current);
		
		/* Resetuje obrazek ve slidu a v nahledu. */
		$("#slideshow_img, #rp_img").fadeIn(0);
		$("#slideshow_img").css({top: "0%", left: "0%"});
		
		this.setInfobox("Následující snímek.");
	}, // SET NEXT SLIDE

	// ========================================

	/* Zvyrazni predchozi polozku. */
	highlightPreviousItem: function()
	{
		if ($("#slideshow_lp_content_ul li").first().hasClass("current"))
		{
			$("#slideshow_lp_content_ul li.current").removeClass("current")
			$("#slideshow_lp_content_ul li:last").addClass("current");	
		} // if
		else
			$("#slideshow_lp_content_ul li.current").removeClass("current").prev().addClass("current");
	}, // HIGHLIGHT PREVIOUS ITEM
	
	// ========================================

	/* Zvyrazni nasledujici polozku. */
	highlightNextItem: function()
	{
		if ($("#slideshow_lp_content_ul li").last().hasClass("current"))
		{
			$("#slideshow_lp_content_ul li.current").removeClass("current")
			$("#slideshow_lp_content_ul li:first").addClass("current");	
		} // if
		else
			$("#slideshow_lp_content_ul li.current").removeClass("current").next().addClass("current");
	}, // HIGHLIGHT NEXT ITEM

	// ========================================

	/* Prohodi aktualni slide se slidem vyse. */
	swapSlidesAbove: function(new_current)
	{
		this.stopSlideshow();
		this.highlightPreviousItem();
		this.swapSlides(new_current);
		
		this.setInfobox("Přesun nahoru.");
	}, // SWAP SLIDES ABOVE

	// ========================================
	
	/* Prohodi aktualni slide se slidem nize. */
	swapSlidesBelow: function(new_current)
	{
		this.stopSlideshow();
		this.highlightNextItem();
		this.swapSlides(new_current);
		
		this.setInfobox("Přesun dolů.");
	}, // SWAP SLIDES BELOW
	
	// ========================================

	/* Prohodi jakekoliv dva slidy. */
	swapSlides: function(new_current)
	{
		this.sort = 5; // nastavi razeni na „Vlastní“
		let old_current = this.current;
		this.current = new_current;
		
		/* Osetruje meze. */
		if (this.current < 0)
			this.current = this.images.length - 1;
		else if (this.current > this.images.length - 1)
			this.current = 0;
		
		/* Prohozeni polozek seznamu v levem panelu. */
		let ul = document.getElementById("slideshow_lp_content_ul");
		let tmp = ul.childNodes[this.current].innerHTML;
		ul.childNodes[this.current].innerHTML = ul.childNodes[old_current].innerHTML;
		ul.childNodes[old_current].innerHTML = tmp;
		
		/* Prohozeni prvku v poli. */
		tmp = this.images[this.current];
		this.images[this.current] = this.images[old_current];
		this.images[old_current] = tmp;
		
		this.checkScrolling(this.current);
	}, // SWAP SLIDES

	// ========================================

	/* Zvysi interval prochazeni slidu. */
	increaseSlideshowInterval: function()
	{
		this.stopSlideshow();
		
		this.slideshowInterval += 1000; // +1 sekunda
		if (this.slideshowInterval > 30000) // limit 30 sekund
			this.slideshowInterval = 30000;
			
		this.setInfobox("Rychlost procházení: " + this.slideshowInterval/1000 + " s");
	}, // INCREASE SLIDESHOW INTERVAL

	// ========================================

	/* Snizi interval prochazeni slidu. */
	decreaseSlideshowInterval: function()
	{
		this.stopSlideshow();
		
		this.slideshowInterval -= 1000; // -1 sekunda
		if (this.slideshowInterval < 1000) // limit 1 sekunda
			this.slideshowInterval = 1000;
			
		this.setInfobox("Rychlost procházení: " + this.slideshowInterval/1000 + " s");
	}, // DECREASE SLIDESHOW INTERVAL
	
	// ========================================

	/* Zapne prezentaci. */
	startPresentation: function()
	{
		if (this.presentation) return;
		this.presentation = 1;
		
		$("#slideshow_bp_content").finish().fadeTo(500, 0.5); // ztlumi ikonky ve spodnim panelu
		$("#settings, #help").fadeOut(500);
		
		if (this.trans == 0) // zadne prechody
			this.nextImageNoMode();
		else if (this.trans == 1) // plynule prechody
			this.nextImageFadeMode();
		else if (this.trans == 2) // vodorovne prechody
		{
			this.nextImageLeftToRight();
			this.stop_callbacks = 0;
		} // else if
		else if (this.trans == 3) // svisle prechody
		{
			this.nextImageTopToBottom();
			this.stop_callbacks = 0;
		} // else if
		
		this.setInfobox("Spuštění prezentace.");
	}, // START PRESENTATION

	// ========================================

	/* Vypne prezentaci s oznamenim. */
	stopPresentation: function()
	{
		this.stopSlideshow();
		$("#settings, #help").fadeOut(500);
		
		this.setInfobox("Zastavení prezentace.");
	}, // STOP PRESENTATION

	// ========================================
	
	/* Vypne prezentaci bez oznameni. */
	stopSlideshow: function()
	{
		clearInterval(this.slideshowTimer);
		this.presentation = 0;
		this.stop_callbacks = 1;
		
		$("#slideshow_bp_content").finish().fadeTo(500, 0.9); // odstrani ztlumeni ikonek ve spodnim panelu
		
		/* Resetuje obrazek ve slidu. */
		$("#slideshow_img").finish();
		$("#slideshow_img").fadeIn(0).css({top: "0%", left: "0%"});
	}, // STOP SLIDESHOW

	// ========================================
	
	/* Zobrazi infobox s kratkou informaci. */
	setInfobox: function(text)
	{
		$("#slideshow_ibox").finish();
		
		infobox = document.getElementById("slideshow_ibox");
		infobox.innerHTML = text;
		
		$("#slideshow_ibox").fadeIn(0).delay(1000).fadeOut(500);
	}, // SET INFOBOX

	// ========================================
	// Editor, nastaveni, napoveda
	// ========================================

	/* Otevre nebo zavre editor. */
	openOrCloseEditor: function()
	{
		$("#slideshow_lp, #slideshow_rp, #slideshow_lp_content, #slideshow_rp_content").finish();
		$("#settings, #help").fadeOut(500);
		
		if ($("#slideshow_lp_content, #slideshow_rp_content").is(":visible")) // panely jsou zobrazene
		{
			$("#slideshow_lp_content, #slideshow_rp_content").fadeOut(500);
			$("#slideshow_lp, #slideshow_rp").delay(500).animate({width: "toggle"}, 500, "linear");
				
			this.setInfobox("Prezentace.");
		} // if
		else // panely jsou skryte
		{
			$("#slideshow_lp, #slideshow_rp").animate({width: "toggle"}, 500, "linear");
			$("#slideshow_lp_content, #slideshow_rp_content").delay(500).fadeIn(500);
			
			this.setInfobox("Editor.");
		} // else
	}, // OPEN OR CLOSE EDITOR

	// ========================================

	/* Otevre nebo zavre nastaveni. */
	openOrCloseSettings: function()
	{
		this.stopSlideshow();
		
		$("#settings").finish();
		if ($("#help").is(":visible")) // napoveda je zobrazena
		{
			$("#help").fadeOut(0);
			$("#settings").fadeIn(0);
			return;
		} // if
		
		if ($("#settings").is(":visible")) // nastaveni je zobrazene
			$("#settings").fadeOut(500);
		else
			$("#settings").fadeIn(500);
	}, // OPEN OR CLOSE SETTINGS

	// ========================================

	/* Otevre nebo zavre napovedu. */
	openOrCloseHelp: function()
	{
		$("#help").finish();
		if ($("#settings").is(":visible")) // nastaveni je zobrazene
		{
			$("#settings").fadeOut(0);
			$("#help").fadeIn(0);
			return;
		} // if
		
		if ($("#help").is(":visible")) // napoveda je zobrazena
			$("#help").fadeOut(500);
		else
			$("#help").fadeIn(500);
	}, // OPEN OR CLOSE HELP

	// ========================================
	// Klikani
	// ========================================

	/* Zkontroluje ikonky ve spodnim panelu (zdali se na ne nekliklo). */
	checkBottomPanelIcons: function(pos)
	{
		for (let i = 0; i < this.icons.length; i++)
		{
			let icon = this.icons[i];
			let top = document.getElementById("slideshow_bp").offsetTop + icon.offsetTop;
			
			if (pos.x > icon.offsetLeft &&
				pos.x < icon.offsetLeft + icon.offsetWidth &&
				pos.y > top &&
				pos.y < top + icon.offsetHeight)
			{
				this.bottomPanelIconClick(i);
				break;
			} // if
		} // for
	}, // CHECK BOTTOM PANEL ICONS

	// ========================================

	/* Urci, co se stane po kliknuti na nekterou z ikonek ve spodnim panelu. */
	bottomPanelIconClick: function(i)
	{
		switch (i)
		{
			case 0:
				this.startPresentation(); // „Play“
				break;
			case 1:
				this.stopPresentation(); // „Stop“
				break;
			case 2:
				this.openOrCloseEditor(); // „Edit“
				break;
			case 3:
				this.openOrCloseSettings(); // „Settings“
				break;
			case 4:
				this.openOrCloseHelp(); // „Help“
				break;
		} // switch
	}, // BOTTOM PANEL ICON CLICK

	// ========================================

	/* Zkontroluje polozky v levem panelu (zdali se na ne nekliklo). */
	checkLeftPanelItems: function(pos)
	{
		if ($("#settings").is(":visible")) // polozky se totiz prekryvaji
			return;
		
		let ul = document.getElementById("slideshow_lp_content_ul");
		let li = ul.getElementsByTagName("li");
		
		for (let i = 0; i < li.length; i++)
		{
			let top = ul.offsetTop + li[i].offsetTop;
			
			if (pos.x > li[i].offsetLeft &&
				pos.x < li[i].offsetLeft + li[i].offsetWidth &&
				pos.y > top &&
				pos.y < top + li[i].offsetHeight)
			{
				this.stopSlideshow();
				this.setSlide(i);
				break;
			} // if
		} // for
	}, // CHECK LEFT PANEL ITEMS

	// ========================================

	/* Zkontroluje polozky v nastaveni (zdali se na ne nekliklo). */
	checkSettingsItems: function(pos)
	{
		let box_trans = document.getElementById("ul_box_item_1");
		let ul_trans = document.getElementById("ul_trans");
		let li_trans = ul_trans.getElementsByTagName("li");
		
		for (let i = 0; i < li_trans.length; i++)
		{
			let top = li_trans[i].offsetTop + ul_trans.offsetTop;
			
			if (pos.x > box_trans.offsetLeft &&
				pos.x < box_trans.offsetLeft + li_trans[i].offsetWidth &&
				pos.y > top &&
				pos.y < top + li_trans[i].offsetHeight)
			{
				/* Zvyrazni danou polozku. */
				$("#ul_trans li.current").removeClass("current");
				$("#ul_trans li").eq(i).addClass("current");
				
				this.trans = i;
				break;
			} // if
		} // for

		// ========================================

		let box_sort = document.getElementById("ul_box_item_2");
		let ul_sort = document.getElementById("ul_sort");
		let li_sort = ul_sort.getElementsByTagName("li");

		if (this.sort != 0) // kvuli vlastnimu razeni
		{
			/* Zvyrazni danou polozku. */
			$("#ul_sort li.current").removeClass("current");
			$("#ul_sort li").eq(this.sort).addClass("current");
		} // if
		
		for (let i = 0; i < li_sort.length; i++)
		{
			let top = li_sort[i].offsetTop + ul_sort.offsetTop;
			
			if (pos.x > box_sort.offsetLeft &&
				pos.x < box_sort.offsetLeft + li_sort[i].offsetWidth &&
				pos.y > top &&
				pos.y < top + li_sort[i].offsetHeight)
			{
				/* Zvyrazni danou polozku. */
				$("#ul_sort li.current").removeClass("current");
				$("#ul_sort li").eq(i).addClass("current");
				
				this.sort = i;
				this.sortSlides();
				break;
			} // if
		} // for

		// ========================================

		let box_sort_direct = document.getElementById("ul_box_item_3");
		let ul_sort_direct = document.getElementById("ul_direct");
		let li_sort_direct = ul_sort_direct.getElementsByTagName("li");
		
		for (let i = 0; i < li_sort_direct.length; i++)
		{
			let top = li_sort_direct[i].offsetTop + ul_sort_direct.offsetTop;
			
			if (pos.x > box_sort_direct.offsetLeft &&
				pos.x < box_sort_direct.offsetLeft + li_sort_direct[i].offsetWidth &&
				pos.y > top &&
				pos.y < top + li_sort_direct[i].offsetHeight)
			{
				/* Zvyrazni danou polozku. */
				$("#ul_direct li.current").removeClass("current");
				$("#ul_direct li").eq(i).addClass("current");
				
				this.sort_direct = i;
				this.sortSlides();
				break;
			} // if
		} // for
	}, // CHECK SETTINGS ITEMS

	// ========================================
	// Scrollovani
	// ========================================

	/* Kontroluje scrollovani (pri ruznych akcich v levem panelu). */
	checkScrolling: function(i)
	{
		let ul = document.getElementById("slideshow_lp_content_ul");
		let li = ul.childNodes[i];
		
		if (ul.offsetHeight <= this.element.clientHeight) // seznam je moc kratky
			return;
		
		if (i == 0) // prvni polozka
			ul.style.top = 0 + "px";
		else if (i == ul.childNodes.length - 1) // posledni polozka
			ul.style.top = this.element.clientHeight - ul.offsetHeight + "px";
		else if (ul.offsetTop + li.offsetTop + li.offsetHeight > this.element.clientHeight) // scrolling dolu
		{
			let diff = (ul.offsetTop + li.offsetTop + li.offsetHeight) - this.element.clientHeight;
			ul.style.top = ul.style.top.replace("px", "") - diff + "px";
		} // else if
		else if (ul.offsetTop + li.offsetTop < 0) // scrolling nahoru
		{
			let diff = ul.offsetTop + li.offsetTop;
			ul.style.top = ul.style.top.replace("px", "") - diff + "px";
		} // else if
		
	}, // CHECK SCROLLING

	// ========================================

	/* Kontroluje lokaci mysi nad levym panelem (pri pouziti kolecka mysi). */
	isMouseInLeftPanel: function(pos, data)
	{
		let lp = document.getElementById("slideshow_lp");
		
		if (pos.x > lp.offsetLeft &&
			pos.x < lp.offsetLeft + lp.offsetWidth &&
			pos.y > lp.offsetTop &&
			pos.y < lp.offsetTop + lp.offsetHeight)
			this.moveWithListOfImages(data); // pohybuje se seznamem obrazku
	}, // IS MOUSE IN LEFT PANEL

	// ========================================

	/* Kontroluje scrollovani (pri pouziti kolecka mysi). */
	moveWithListOfImages: function(data)
	{
		let ul = document.getElementById("slideshow_lp_content_ul");
		let shift = parseInt(data.wheelDelta * 50); // ↑ negative, ↓ positive
		
		if (ul.offsetTop - shift > 0) // horni hranice scrollovani
			ul.style.top = 0 + "px";
		else if (this.element.clientHeight - ul.offsetTop + shift > ul.offsetHeight) // dolni hranice scrollovani
		{
			let diff = ul.offsetHeight - (this.element.clientHeight - ul.offsetTop);
			ul.style.top = ul.offsetTop - diff + "px";
		} // else if
		else // bezny pripad
			ul.style.top = ul.offsetTop - shift + "px";
	}, // MOVE WITH LIST OF IMAGES
	
	// ========================================
	// Pohyb s mysi
	// ========================================	
	
	/* Rozsvecuje a tlumi ikonky ve spodnim panelu pri prezentaci. */
	isMouseInBottomPanel: function(pos)
	{
		if (!this.presentation) return; // prezentace nebezi
		
		let bp = document.getElementById("slideshow_bp");
		let bpc = document.getElementById("slideshow_bp_content");
		
		if (pos.x > bpc.offsetLeft &&
			pos.x < bpc.offsetLeft + bpc.offsetWidth &&
			pos.y > bp.offsetTop &&
			pos.y < bp.offsetTop + bp.offsetHeight)
			$("#slideshow_bp_content").fadeTo(0, 0.9);
		else
			$("#slideshow_bp_content").fadeTo(0, 0.5);
	} // IS MOUSE IN BOTTOM PANEL
});
