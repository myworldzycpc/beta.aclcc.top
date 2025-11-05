        function toggleMenu() {
            const menu = document.querySelector('.navbar-menu');
            menu.classList.toggle('active');
        }

        // 滚动时隐藏/显示导航栏
        let lastScrollPosition = 0;
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            const currentScrollPosition = window.pageYOffset;

            if (currentScrollPosition > lastScrollPosition) {
                // 向下滚动
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // 向上滚动
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollPosition = currentScrollPosition;
        });