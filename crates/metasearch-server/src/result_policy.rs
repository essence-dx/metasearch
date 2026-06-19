//! Result filtering policy applied before search responses are cached.

use metasearch_core::result::SearchResult;
use url::Url;

#[derive(Debug, Clone)]
pub struct ResultPolicy {
    blocked_domains: Vec<String>,
}

impl ResultPolicy {
    pub fn new(blocked_domains: impl IntoIterator<Item = String>) -> Self {
        Self {
            blocked_domains: normalize_blocked_domains(blocked_domains),
        }
    }

    pub fn allows(&self, result: &SearchResult) -> bool {
        let Some(domain) = result_domain(&result.url) else {
            return true;
        };

        !self
            .blocked_domains
            .iter()
            .any(|blocked_domain| domain_matches(&domain, blocked_domain))
    }
}

fn normalize_blocked_domains(blocked_domains: impl IntoIterator<Item = String>) -> Vec<String> {
    let mut domains: Vec<String> = blocked_domains
        .into_iter()
        .filter_map(|domain| normalize_domain(&domain))
        .collect();

    domains.sort();
    domains.dedup();
    domains
}

fn normalize_domain(domain: &str) -> Option<String> {
    let normalized = domain.trim().trim_end_matches('.').to_ascii_lowercase();
    let normalized = normalized
        .trim_start_matches("*.")
        .trim_start_matches("www.")
        .to_string();

    (!normalized.is_empty()).then_some(normalized)
}

fn result_domain(raw_url: &str) -> Option<String> {
    let url = Url::parse(raw_url).ok()?;
    normalize_domain(url.host_str()?)
}

fn domain_matches(domain: &str, blocked_domain: &str) -> bool {
    domain == blocked_domain || domain.ends_with(&format!(".{blocked_domain}"))
}

#[cfg(test)]
mod tests {
    use super::ResultPolicy;
    use metasearch_core::result::SearchResult;

    #[test]
    fn blocks_exact_domain_and_subdomains() {
        let policy = ResultPolicy::new(["9gag.com".to_string()]);

        assert!(!policy.allows(&result("https://9gag.com/gag/aLnZ7eA")));
        assert!(!policy.allows(&result("https://images.9gag.com/example")));
    }

    #[test]
    fn allows_unrelated_domains_with_similar_names() {
        let policy = ResultPolicy::new(["9gag.com".to_string()]);

        assert!(policy.allows(&result("https://not9gag.com/page")));
        assert!(policy.allows(&result("https://example.com/9gag.com")));
    }

    fn result(url: &str) -> SearchResult {
        SearchResult::new("title", url, "content", "engine")
    }
}
