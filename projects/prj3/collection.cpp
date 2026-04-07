/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
*/
#include "collection.h"

#include <algorithm>
#include <stdexcept>

namespace seneca
{
    Collection::Collection(const std::string& name)
        : m_name(name)
    {
    }

    Collection::~Collection()
    {
        for (auto item : m_items)
            delete item;
    }

    const std::string& Collection::name() const
    {
        return m_name;
    }

    size_t Collection::size() const
    {
        return m_items.size();
    }

    void Collection::setObserver(void (*observer)(const Collection&, const MediaItem&))
    {
        m_observer = observer;
    }

    Collection& Collection::operator+=(MediaItem* item)
    {
        auto found = std::find_if(
            m_items.begin(),
            m_items.end(),
            [item](const MediaItem* existing)
            {
                return existing->getTitle() == item->getTitle();
            }
        );

        if (found == m_items.end())
        {
            m_items.push_back(item);
            if (m_observer)
                m_observer(*this, *item);
        }
        else
        {
            delete item;
        }

        return *this;
    }

    MediaItem* Collection::operator[](size_t idx) const
    {
        if (idx >= m_items.size())
            throw std::out_of_range(
                "Bad index [" + std::to_string(idx) + "]. Collection has [" + std::to_string(m_items.size()) + "] items."
            );

        return m_items[idx];
    }

    MediaItem* Collection::operator[](const std::string& title) const
    {
        auto it = std::find_if(
            m_items.begin(),
            m_items.end(),
            [title](const MediaItem* item)
            {
                return item->getTitle() == title;
            }
        );

        return (it != m_items.end()) ? *it : nullptr;
    }

    void Collection::removeQuotes()
    {
        std::for_each(
            m_items.begin(),
            m_items.end(),
            [](MediaItem* item)
            {
                auto strip = [](std::string text) -> std::string
                    {
                        if (!text.empty() && text.front() == '"')
                            text.erase(0, 1);
                        if (!text.empty() && text.back() == '"')
                            text.pop_back();
                        return text;
                    };

                item->setTitle(strip(item->getTitle()));
                item->setSummary(strip(item->getSummary()));
            }
        );
    }

    void Collection::sort(const std::string& field)
    {
        if (field == "title")
        {
            std::sort(
                m_items.begin(),
                m_items.end(),
                [](const MediaItem* a, const MediaItem* b)
                {
                    return a->getTitle() < b->getTitle();
                }
            );
        }
        else if (field == "year")
        {
            std::sort(
                m_items.begin(),
                m_items.end(),
                [](const MediaItem* a, const MediaItem* b)
                {
                    return a->getYear() < b->getYear();
                }
            );
        }
    }

    std::ostream& operator<<(std::ostream& out, const Collection& collection)
    {
        for (size_t i = 0; i < collection.size(); ++i)
            out << *collection[i];

        return out;
    }
}