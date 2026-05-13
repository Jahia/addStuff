import net.sf.ehcache.CacheManager
import org.jahia.services.SpringContextSingleton

// 1. Flush via Jahia's ModuleCacheProvider (owns the HTML render cache)
try {
    def provider = SpringContextSingleton.getInstance().getContext().getBean("moduleCacheProvider")
    provider.getCache()?.removeAll()
    provider.getDependenciesCache()?.removeAll()
} catch (Exception ignored) {}

// 2. Flush all active Ehcache managers — CacheManager.getInstance() only returns the default
//    instance; Jahia creates named managers for its HTML caches that would be missed otherwise.
for (def cm : CacheManager.ALL_CACHE_MANAGERS) {
    for (def name : cm.cacheNames) {
        cm.getEhcache(name)?.removeAll()
    }
}
