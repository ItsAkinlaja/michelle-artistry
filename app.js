document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // 2. Active Navigation Highlight
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Match home or specific pages
        if ((pageName === '' || pageName === 'index.html') && (linkHref === 'index.html' || linkHref === '#home')) {
            link.classList.add('active');
        } else if (linkHref && linkHref !== '#' && pageName.includes(linkHref.replace('.html', ''))) {
            link.classList.add('active');
        }
    });

    // 3. Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 4. Ambient Canvas Particles (Only on Home/Hero)
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * -0.6 - 0.1; // Move upwards slowly
                this.opacity = Math.random() * 0.5 + 0.2;
                this.fadeRate = Math.random() * 0.005 + 0.002;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                // Slowly fade in/out
                if (this.opacity <= 0) {
                    this.x = Math.random() * width;
                    this.y = height + 10;
                    this.opacity = Math.random() * 0.5 + 0.2;
                    this.speedY = Math.random() * -0.6 - 0.1;
                } else {
                    this.opacity -= this.fadeRate;
                }
            }

            draw() {
                ctx.fillStyle = `rgba(0, 245, 212, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Initialize particles
        const particleCount = Math.min(60, Math.floor(width / 20));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // 5. Dynamic Lightbox Builder
    let lightbox = document.querySelector('.lightbox');
    if (!lightbox) {
        // Create lightbox structure dynamically if it doesn't exist
        lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <div class="lightbox-close">&times;</div>
                <img src="" alt="Zoomed view">
                <div class="lightbox-caption"></div>
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    const lightboxImg = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    // Attach click events to all portfolio images
    const setupLightboxTriggers = () => {
        // Support both revamped grid images and legacy layout images
        const galleryImages = document.querySelectorAll('.gallery-grid img, .samples img');
        
        galleryImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightboxCaption.textContent = img.alt || 'Artwork Masterpiece';
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
    };

    setupLightboxTriggers();

    // Close Lightbox
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => { lightboxImg.src = ''; }, 400); // clear src after transition
    };

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // 6. Testimonial Carousel Auto-Slide
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    if (testimonialCards.length > 0) {
        let currentIndex = 0;
        
        const showTestimonial = (index) => {
            testimonialCards.forEach((card, i) => {
                card.style.display = i === index ? 'block' : 'none';
                card.style.opacity = i === index ? '1' : '0';
            });
        };

        // If we want a transition effect, we can apply styling
        testimonialCards.forEach((card, i) => {
            card.style.transition = 'opacity 0.8s ease';
            if (i > 0) {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        });

        // Simple automatic slide every 6 seconds
        setInterval(() => {
            currentIndex = (currentIndex + 1) % testimonialCards.length;
            
            // Fade out current
            testimonialCards.forEach(c => c.style.opacity = '0');
            setTimeout(() => {
                showTestimonial(currentIndex);
            }, 300);
        }, 6000);
    }

    // 7. Interactive Commission Price Estimator
    const artTypeSelect = document.getElementById('art-type');
    const complexityRange = document.getElementById('complexity');
    const complexityValueText = document.getElementById('complexity-value');
    const finalPriceText = document.getElementById('estimated-price');
    const startCommissionBtn = document.getElementById('start-commission-btn');

    if (artTypeSelect && complexityRange && finalPriceText) {
        // Pricing structure
        const basePrices = {
            'character-design': 80,
            'manga-art': 90,
            'comics-storyboard': 120,
            'book-cover': 100,
            'children-book': 70,
            'portrait': 50,
            'fan-art': 60,
            'logos': 45
        };

        const complexityLabels = {
            '1': 'Basic (Flat Color / Simple)',
            '2': 'Standard (Full Shade / Details)',
            '3': 'Complex (Detailed Background / Advanced shading)'
        };

        const updatePrice = () => {
            const selectedType = artTypeSelect.value;
            const complexityFactor = parseFloat(complexityRange.value); // 1, 2, or 3
            
            if (!selectedType || !basePrices[selectedType]) return;

            const basePrice = basePrices[selectedType];
            
            // Formula: Price = Base Price * Complexity Multiplier
            // Complexity multiplier: 1x, 1.5x, 2.2x
            let multiplier = 1.0;
            if (complexityFactor === 2) multiplier = 1.5;
            if (complexityFactor === 3) multiplier = 2.2;

            const finalPrice = Math.round(basePrice * multiplier);

            // Update UI text
            complexityValueText.textContent = complexityLabels[complexityRange.value];
            finalPriceText.textContent = `$${finalPrice}`;
        };

        artTypeSelect.addEventListener('change', updatePrice);
        complexityRange.addEventListener('input', updatePrice);

        // Pre-fill mailto link with choices
        if (startCommissionBtn) {
            startCommissionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const typeText = artTypeSelect.options[artTypeSelect.selectedIndex].text;
                const complexityText = complexityLabels[complexityRange.value];
                const priceText = finalPriceText.textContent;
                
                const subject = encodeURIComponent(`Artwork Commission Inquiry - ${typeText}`);
                const body = encodeURIComponent(
                    `Hi Michelle,\n\nI'm interested in booking an artwork commission!\n\nDetails of my project:\n- Commission Type: ${typeText}\n- Complexity Style: ${complexityText}\n- Estimated Price Reference: ${priceText}\n\n[Please describe your characters, scenes, references or files here]\n\nLooking forward to working together!\n`
                );
                
                window.open(`mailto:michelleartistry992@gmail.com?subject=${subject}&body=${body}`, '_blank');
            });
        }

        // Initialize calculation
        updatePrice();
    }

    // 8. Dynamic Gallery Loader (Supabase & ImageKit)
    let supabase = null;
    if (window.supabase && window.CONFIG) {
        supabase = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY);
    }

    const dynamicGallery = document.getElementById('dynamic-gallery');
    if (dynamicGallery && supabase) {
        const category = dynamicGallery.getAttribute('data-category');
        
        // Show glassmorphic loading spinner
        dynamicGallery.innerHTML = `
            <div class="loading-spinner-container" style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--primary);">
                <div class="spinner" style="width: 40px; height: 40px; border: 4px solid rgba(201, 152, 24, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                <p style="font-family: var(--font-heading); font-weight: 500; letter-spacing: 0.05em; font-size: 1rem; color: var(--text-muted);">Retrieving Masterpieces...</p>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        supabase
            .from('artworks')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching artworks from Supabase:', error);
                    dynamicGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--accent); padding: 50px;">Failed to load artworks. Please check your Supabase credentials.</div>';
                    return;
                }
                
                if (!data || data.length === 0) {
                    dynamicGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 60px 0; font-size: 1.1rem;">This gallery is currently empty. Check back soon for new masterpieces!</div>';
                    return;
                }
                
                dynamicGallery.innerHTML = '';
                data.forEach(item => {
                    // Use ImageKit CDN proxy for resizing and formats, fallback to Supabase public storage
                    let endpoint = (window.CONFIG && window.CONFIG.IMAGEKIT_URL_ENDPOINT) || '';
                    const fullPath = `artworks/${item.image_path}`;
                    const ikUrl = endpoint ? (endpoint.replace(/\/$/, '') + '/' + fullPath + '?tr=w-800,q-85') : '';
                    const supaUrl = `${window.CONFIG.SUPABASE_URL}/storage/v1/object/public/artworks/${encodeURI(item.image_path)}`;

                    const galleryItem = document.createElement('div');
                    galleryItem.className = 'gallery-item';
                    const img = document.createElement('img');
                    img.loading = 'lazy';
                    img.alt = item.title || 'Artwork';
                    if (ikUrl) img.src = ikUrl; else img.src = supaUrl;
                    let triedSupabase = false;
                    img.onerror = () => {
                        if (!triedSupabase) {
                            triedSupabase = true;
                            img.src = supaUrl;
                            return;
                        }
                        img.src = '';
                    };

                    const overlay = document.createElement('div');
                    overlay.className = 'gallery-item-overlay';
                    overlay.innerHTML = '<div class="gallery-item-icon">👁</div>';

                    galleryItem.appendChild(img);
                    galleryItem.appendChild(overlay);
                    dynamicGallery.appendChild(galleryItem);
                });
                
                // Re-bind lightbox event listeners to the newly created images
                setupLightboxTriggers();
            });
    }
});
